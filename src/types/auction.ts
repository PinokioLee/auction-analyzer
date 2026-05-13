// ── 입력 ──────────────────────────────────────────

export interface AuctionInput {
  apartmentName: string;
  area: number;
  // TODO: 국토부 단지 데이터 수집 완료 후 층수 입력 필드 복원
  bidPrice: number;
  regionCode: string; // 법정동코드 5자리
  additionalCosts: AdditionalCosts;
}

export interface AdditionalCosts {
  legalFee: number;          // 법무사 비용 (만원)
  evictionFee: number;       // 명도비용 (만원)
  unpaidMaintenance: number; // 미납관리비 (만원)
  loanInterest: number;      // 대출이자 (만원)
  enforcementFee: number;    // 강제집행 비용 (만원)
}

// ── 국토부 실거래 ──────────────────────────────────

export interface AptTransaction {
  aptName: string;
  area: number;      // 전용면적 (㎡)
  floor: number;     // 층
  dealAmount: number; // 거래금액 (만원)
  dealYear: string;
  dealMonth: string;
}

export interface FloorPriceAnalysis {
  // 평균가 (수익 계산 기준)
  low: number;
  mid: number;
  high: number;
  // tier별 저가 / 고가 / 건수
  lowMin: number;  lowMax: number;  lowCount: number;
  midMin: number;  midMax: number;  midCount: number;
  highMin: number; highMax: number; highCount: number;
  dataCount: number;
  period: string;   // "2023.05 ~ 2026.05"
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
  interiorCost: number;      // 인테리어 비용 (만원)
  loanInterest: number;
  loanFee: number;           // 대출수수료 (만원)
  prepaymentPenalty: number; // 중도상환수수료 (만원)
  enforcementCost: number;
  totalCost: number;
}

export interface ProfitAnalysis {
  lowProfit: number;  // 저층 기준 차익 (만원)
  midProfit: number;
  highProfit: number;
  lowROI: number;     // 수익률 (%)
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
