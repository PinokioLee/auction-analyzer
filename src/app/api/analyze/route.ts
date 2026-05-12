import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentTransactions, analyzePriceByFloor } from "@/lib/molit/client";
import { calculateAcquisitionTax } from "@/lib/calculator/acquisition-tax";
import type { AnalyzeResult, CostBreakdown, ProfitAnalysis } from "@/types/auction";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const {
    apartmentName,
    area,
    floor,
    totalFloors,
    bidPrice,
    regionCode,
    legalFee = 50,
    evictionCost = 300,
    unpaidMaintenance = 0,
    loanInterest = 0,
    enforcementCost = 0,
  } = body as Record<string, unknown>;

  // 필수값 검증
  if (
    typeof apartmentName !== "string" || !apartmentName.trim() ||
    typeof area !== "number" || area <= 0 ||
    typeof floor !== "number" ||
    typeof totalFloors !== "number" ||
    typeof bidPrice !== "number" || bidPrice <= 0 ||
    typeof regionCode !== "string" || regionCode.length !== 5
  ) {
    return NextResponse.json(
      { error: "필수 입력값이 누락되었거나 올바르지 않습니다." },
      { status: 400 }
    );
  }

  // ① 국토부 실거래가 조회
  let transactions;
  try {
    transactions = await fetchRecentTransactions(
      apartmentName as string,
      area as number,
      regionCode as string,
      6
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "국토부 API 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ② 층별 시세 분석
  const priceAnalysis = analyzePriceByFloor(
    transactions,
    totalFloors as number,
    6
  );

  // ③ 취득세 계산
  const taxResult = calculateAcquisitionTax(bidPrice as number, area as number);
  const additionalSum =
    (legalFee as number) +
    (evictionCost as number) +
    (unpaidMaintenance as number) +
    (loanInterest as number) +
    (enforcementCost as number);
  const totalCost =
    (bidPrice as number) + taxResult.total + additionalSum;

  const costs: CostBreakdown = {
    bidPrice: bidPrice as number,
    acquisitionTax: taxResult.acquisitionTax,
    educationTax: taxResult.educationTax,
    ruralTax: taxResult.ruralTax,
    legalFee: legalFee as number,
    evictionCost: evictionCost as number,
    unpaidMaintenance: unpaidMaintenance as number,
    loanInterest: loanInterest as number,
    enforcementCost: enforcementCost as number,
    totalCost,
  };

  // ④ 수익 분석
  const calcProfit = (marketPrice: number) => marketPrice - totalCost;
  const calcROI = (profit: number) =>
    totalCost > 0 ? Math.round((profit / totalCost) * 1000) / 10 : 0;

  const lowProfit = calcProfit(priceAnalysis.low);
  const midProfit = calcProfit(priceAnalysis.mid);
  const highProfit = calcProfit(priceAnalysis.high);

  const profitAnalysis: ProfitAnalysis = {
    lowProfit,
    midProfit,
    highProfit,
    lowROI: calcROI(lowProfit),
    midROI: calcROI(midProfit),
    highROI: calcROI(highProfit),
  };

  // ⑤ Supabase 저장
  let historyId = "";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("analysis_history")
      .insert({
        apartment_name: (apartmentName as string).trim(),
        area: area as number,
        floor: floor as number,
        total_floors: totalFloors as number,
        bid_price: bidPrice as number,
        acquisition_tax: taxResult.total,
        legal_fee: legalFee as number,
        eviction_cost: evictionCost as number,
        unpaid_maintenance: unpaidMaintenance as number,
        loan_interest: loanInterest as number,
        enforcement_cost: enforcementCost as number,
        total_cost: totalCost,
        price_analysis: JSON.parse(JSON.stringify(priceAnalysis)),
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

  const result: AnalyzeResult = {
    priceAnalysis,
    costs,
    profitAnalysis,
    historyId,
  };

  return NextResponse.json(result);
}
