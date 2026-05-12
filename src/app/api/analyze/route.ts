import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNaverTransactions } from "@/lib/naver/client";
import { fetchRecentTransactions, analyzePriceByFloor } from "@/lib/molit/client";
import { calculateAcquisitionTax } from "@/lib/calculator/acquisition-tax";
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
    apartmentName,
    area,
    floor,
    totalFloors,
    bidPrice,
    // 네이버 단지 정보 (새 방식)
    complexNo,
    pyeongNo,
    // 국토부 폴백용 (구 방식)
    regionCode,
    // 부대비용
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
    typeof bidPrice !== "number" || bidPrice <= 0
  ) {
    return NextResponse.json(
      { error: "필수 입력값이 누락되었거나 올바르지 않습니다." },
      { status: 400 }
    );
  }

  // ① 실거래가 조회 (네이버 우선 → 국토부 폴백)
  let transactions: AptTransaction[] = [];
  let dataSource = "naver";

  if (typeof complexNo === "string" && complexNo && typeof pyeongNo === "string" && pyeongNo) {
    // 네이버 실거래가
    try {
      const naverTx = await fetchNaverTransactions(complexNo, pyeongNo);
      transactions = naverTx.map((t) => ({
        aptName: apartmentName as string,
        area: area as number,
        floor: t.floor,
        dealAmount: t.dealAmount,
        dealYear: t.dealYear,
        dealMonth: t.dealMonth,
      }));
    } catch (err) {
      console.warn("[analyze] 네이버 실거래 실패, 국토부로 폴백:", err);
      dataSource = "molit_fallback";
    }
  }

  // 국토부 폴백: 네이버 실패했거나 complexNo 없을 때
  if (
    transactions.length === 0 &&
    typeof regionCode === "string" &&
    regionCode.length === 5
  ) {
    try {
      transactions = await fetchRecentTransactions(
        apartmentName as string,
        area as number,
        regionCode,
        6
      );
      dataSource = "molit";
    } catch (err) {
      console.warn("[analyze] 국토부 폴백도 실패:", err);
      dataSource = "none";
    }
  }

  // ② 층별 시세 분석
  const priceAnalysis = analyzePriceByFloor(transactions, totalFloors as number, 6);

  // ③ 취득세 계산
  const taxResult = calculateAcquisitionTax(bidPrice as number, area as number);
  const additionalSum =
    (legalFee as number) +
    (evictionCost as number) +
    (unpaidMaintenance as number) +
    (loanInterest as number) +
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
    loanInterest: loanInterest as number,
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
        price_analysis: JSON.parse(
          JSON.stringify({ ...priceAnalysis, dataSource })
        ),
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
