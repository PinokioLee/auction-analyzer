import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateAcquisitionTax } from "@/lib/calculator/acquisition-tax";
import { analyzePriceByFloor } from "@/lib/molit/client";
import type {
  AptTransaction,
  AnalyzeResult,
  CostBreakdown,
  ProfitAnalysis,
} from "@/types/auction";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const {
    lawdCd,
    aptName,
    exclusiveArea,
    floor,
    totalFloors,
    bidPrice,
    legalFee          = 80,
    evictionCost      = 0,
    unpaidMaintenance = 100,
    interiorCost      = 0,
    loanAmount        = 0,
    loanInterest      = 0,
    loanFee           = 0,
    prepaymentPenalty = 0,
    enforcementCost   = 0,
    holdMonths        = 12,
    loanRate          = 0,
  } = body as Record<string, unknown>;

  if (
    typeof lawdCd !== "string" || !lawdCd ||
    typeof aptName !== "string" || !aptName.trim() ||
    typeof exclusiveArea !== "number" || exclusiveArea <= 0 ||
    typeof bidPrice !== "number" || bidPrice <= 0
  ) {
    return NextResponse.json(
      { error: "필수 입력값이 누락되었거나 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // ① 실거래가 조회 (최근 6개월)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = sixMonthsAgo.toISOString().slice(0, 10);

  const { data: txData } = await supabase
    .from("apt_transactions")
    .select("floor, deal_amount, deal_date")
    .eq("lawd_cd", lawdCd)
    .eq("apt_name", aptName)
    .eq("exclusive_area", exclusiveArea)
    .gte("deal_date", cutoff)
    .order("deal_date", { ascending: false })
    .limit(200);

  const transactions: AptTransaction[] = (txData ?? []).map((t) => ({
    aptName: aptName as string,
    area: exclusiveArea as number,
    floor: t.floor ?? 1,
    dealAmount: t.deal_amount,
    dealYear: String(t.deal_date).slice(0, 4),
    dealMonth: String(t.deal_date).slice(5, 7),
  }));

  // ② 층별 시세 분석
  const totalFloorNum = typeof totalFloors === "number" ? totalFloors : 20;
  const priceAnalysis = analyzePriceByFloor(transactions, totalFloorNum, 6);
  const dataSource = transactions.length > 0 ? "apt_db" : "none";

  // ③ 취득세 계산
  const taxResult = calculateAcquisitionTax(bidPrice as number, exclusiveArea as number);
  const additionalSum =
    (legalFee as number) +
    (evictionCost as number) +
    (unpaidMaintenance as number) +
    (interiorCost as number) +
    (loanInterest as number) +
    (loanFee as number) +
    (prepaymentPenalty as number) +
    (enforcementCost as number);
  const totalCost = (bidPrice as number) + taxResult.total + additionalSum;

  const costs: CostBreakdown = {
    bidPrice: bidPrice as number,
    acquisitionTax: taxResult.acquisitionTax,
    educationTax: taxResult.educationTax,
    ruralTax: taxResult.ruralTax,
    legalFee: legalFee as number,
    evictionCost: evictionCost as number,
    unpaidMaintenance: unpaidMaintenance as number,
    interiorCost: interiorCost as number,
    loanInterest: loanInterest as number,
    loanFee: loanFee as number,
    prepaymentPenalty: prepaymentPenalty as number,
    enforcementCost: enforcementCost as number,
    totalCost,
  };

  // ④ 수익 분석
  const calcProfit = (p: number) => p - totalCost;
  const calcROI = (profit: number) =>
    totalCost > 0 ? Math.round((profit / totalCost) * 1000) / 10 : 0;

  const profitAnalysis: ProfitAnalysis = {
    lowProfit: calcProfit(priceAnalysis.low),
    midProfit: calcProfit(priceAnalysis.mid),
    highProfit: calcProfit(priceAnalysis.high),
    lowROI: calcROI(calcProfit(priceAnalysis.low)),
    midROI: calcROI(calcProfit(priceAnalysis.mid)),
    highROI: calcROI(calcProfit(priceAnalysis.high)),
  };

  // ⑤ Supabase 저장
  let historyId = "";
  try {
    const { data, error } = await supabase
      .from("analysis_history")
      .insert({
        apartment_name:     (aptName as string).trim(),
        area:               exclusiveArea as number,
        floor:              typeof floor === "number" ? floor : 1,
        total_floors:       totalFloorNum,
        bid_price:          bidPrice as number,
        acquisition_tax:    taxResult.total,
        legal_fee:          legalFee as number,
        eviction_cost:      evictionCost as number,
        unpaid_maintenance: unpaidMaintenance as number,
        interior_cost:      interiorCost as number,
        loan_amount:        loanAmount as number,
        loan_interest:      loanInterest as number,
        loan_fee:           loanFee as number,
        prepayment_penalty: prepaymentPenalty as number,
        enforcement_cost:   enforcementCost as number,
        total_cost:         totalCost,
        price_analysis:     JSON.parse(JSON.stringify({ ...priceAnalysis, dataSource, lawdCd, holdMonths, loanRate })),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Supabase] 저장 실패:", error.message);
    } else {
      historyId = data.id;
    }
  } catch (err) {
    console.error("[Supabase] 예외:", err);
  }

  const result: AnalyzeResult = { priceAnalysis, costs, profitAnalysis, historyId };
  return NextResponse.json(result);
}
