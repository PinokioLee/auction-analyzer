import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateAcquisitionTax } from "@/lib/calculator/acquisition-tax";
import type {
  AnalyzeResult,
  CostBreakdown,
  FloorPriceAnalysis,
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
    expectedPrice = 0, // 사용자가 직접 입력한 참고 시세 (선택)
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

  // ① 취득세 계산
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

  // ② 참고 시세 기반 수익 분석
  const refPrice = typeof expectedPrice === "number" ? (expectedPrice as number) : 0;

  const priceAnalysis: FloorPriceAnalysis & { dataSource: string } = {
    low: refPrice,
    mid: refPrice,
    high: refPrice,
    dataCount: refPrice > 0 ? 1 : 0,
    period: refPrice > 0 ? "사용자 입력" : "",
    dataSource: refPrice > 0 ? "user_input" : "none",
  };

  const calcProfit = (p: number) => p - totalCost;
  const calcROI = (profit: number) =>
    totalCost > 0 ? Math.round((profit / totalCost) * 1000) / 10 : 0;

  const profitAnalysis: ProfitAnalysis = {
    lowProfit: refPrice > 0 ? calcProfit(refPrice) : 0,
    midProfit: refPrice > 0 ? calcProfit(refPrice) : 0,
    highProfit: refPrice > 0 ? calcProfit(refPrice) : 0,
    lowROI: refPrice > 0 ? calcROI(calcProfit(refPrice)) : 0,
    midROI: refPrice > 0 ? calcROI(calcProfit(refPrice)) : 0,
    highROI: refPrice > 0 ? calcROI(calcProfit(refPrice)) : 0,
  };

  // ③ Supabase 저장
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

  const result: AnalyzeResult = { priceAnalysis, costs, profitAnalysis, historyId };
  return NextResponse.json(result);
}
