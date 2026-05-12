// ── 입력 ──────────────────────────────────────────

export interface AuctionInput {
  apartmentName: string;
  area: number;
  floor: number;
  totalFloors: number;
  bidPrice: number;
  regionCode: string; // 법정동코드 5자리
  additionalCosts: AdditionalCosts;
}

export interface AdditionalCosts {
  legalFee: number; // 법무사 비용 (만원)
  evictionFee: number; // 명도비용 (만원)
  unpaidMaintenance: number; // 미납관리비 (만원)
  loanInterest: number; // 대출이자 (만원)
  enforcementFee: number; // 강제집행 비용 (만원)
}

// ── 국토부 실거래 ──────────────────────────────────

export interface AptTransaction {
  aptName: string;
  area: number; // 전용면적 (㎡)
  floor: number; // 층
  dealAmount: number; // 거래금액 (만원)
  dealYear: string;
  dealMonth: string;
}

export interface FloorPriceAnalysis {
  low: number; // 저층 평균 (만원)
  mid: number; // 중층 평균 (만원)
  high: number; // RR 평균 (만원)
  dataCount: number;
  period: string; // "2025.11 ~ 2026.04"
}

// ── 비용 계산 ─────────────────────────────────────

export interface AcquisitionTaxResult {
  acquisitionTax: number;
  educationTax: number;
  ruralTax: number;
  total: number;
}

export interface CostBreakdown {
  bidPrice: number;
  acquisitionTax: number;
  educationTax: number;
  ruralTax: number;
  legalFee: number;
  evictionCost: number;
  unpaidMaintenance: number;
  loanInterest: number;
  enforcementCost: number;
  totalCost: number; // 최종 취득가 (만원)
}

export interface ProfitAnalysis {
  lowProfit: number; // 저층 기준 차익 (만원)
  midProfit: number;
  highProfit: number;
  lowROI: number; // 수익률 (%)
  midROI: number;
  highROI: number;
}

// ── API 결과 ──────────────────────────────────────

export interface AnalyzeResult {
  priceAnalysis: FloorPriceAnalysis;
  costs: CostBreakdown;
  profitAnalysis: ProfitAnalysis;
  historyId: string;
}

// ── 레거시 (하위호환) ──────────────────────────────

export interface TotalCostResult {
  bidPrice: number;
  acquisitionTax: AcquisitionTaxResult;
  additionalCosts: AdditionalCosts;
  grandTotal: number;
}
