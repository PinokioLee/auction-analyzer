// 출구전략별 세후 수익률 계산 (참고용 시뮬레이션 - 실제 세금과 다를 수 있음)

// ── 공인중개사 수수료 ────────────────────────────────────
function calcBrokerage(manwon: number): number {
  const won = manwon * 10_000;
  let rate: number;
  let maxFee = Infinity;

  if (won < 50_000_000)         { rate = 0.006; maxFee = 250_000; }
  else if (won < 200_000_000)   { rate = 0.005; maxFee = 800_000; }
  else if (won < 900_000_000)   { rate = 0.004; }
  else if (won < 1_200_000_000) { rate = 0.005; }
  else if (won < 1_500_000_000) { rate = 0.006; }
  else                           { rate = 0.007; }

  return Math.round(Math.min(won * rate, maxFee) / 10_000);
}

// ── 누진세율 계산 (만원 기준) ────────────────────────────
function calcProgressiveTax(taxBaseManwon: number): number {
  if (taxBaseManwon <= 0) return 0;
  const w = taxBaseManwon * 10_000;

  let tax: number;
  if      (w <= 14_000_000)  tax = w * 0.06;
  else if (w <= 50_000_000)  tax = w * 0.15 - 1_080_000;
  else if (w <= 88_000_000)  tax = w * 0.24 - 5_220_000;
  else if (w <= 150_000_000) tax = w * 0.35 - 14_900_000;
  else if (w <= 300_000_000) tax = w * 0.38 - 19_400_000;
  else if (w <= 500_000_000) tax = w * 0.40 - 25_400_000;
  else if (w <= 1_000_000_000) tax = w * 0.42 - 35_400_000;
  else                         tax = w * 0.45 - 65_400_000;

  return Math.round(tax / 10_000);
}

// ── 양도소득세 계산 ──────────────────────────────────────
// 일반 개인, 1주택 기준 (다주택·법인 제외)
// 실제 세금과 다를 수 있습니다 — 참고용으로만 사용하세요.
export function calcCapitalGainsTax(
  gainManwon: number,   // 양도차익 (세전수익) 만원
  holdMonths: number    // 실제 보유 개월수
): number {
  if (gainManwon <= 0) return 0;

  const holdYears = holdMonths / 12;

  // 단기 세율 (보유기간 2년 미만)
  if (holdMonths < 12) {
    const tax = Math.round(gainManwon * 0.70);
    return Math.round(tax * 1.1); // 지방소득세 10%
  }
  if (holdMonths < 24) {
    const tax = Math.round(gainManwon * 0.60);
    return Math.round(tax * 1.1);
  }

  // 2년 이상: 장기보유특별공제 + 기본공제 250만원 + 누진세율
  const longTermDeduction = Math.min(holdYears * 0.02, 0.30); // 연 2%, 최대 30%
  const afterLongTerm = Math.round(gainManwon * (1 - longTermDeduction));
  const BASIC_DEDUCTION = 250; // 기본공제 250만원
  const taxBase = Math.max(0, afterLongTerm - BASIC_DEDUCTION);
  const incomeTax = calcProgressiveTax(taxBase);

  return Math.round(incomeTax * 1.1); // 지방소득세 10%
}

// ── 출구전략 결과 타입 ───────────────────────────────────
export interface ExitStrategyResult {
  label: string;
  holdMonths: number;
  brokerage: number;
  grossProfit: number;  // 세전수익 (만원)
  taxAmount: number;    // 양도세+지방소득세 (만원)
  netProfit: number;    // 세후수익 (만원)
  netROI: number;       // 세후수익률 % (실투자금 대비, 대출 있을 때)
  baseROI: number;      // 세후수익률 % (취득가 대비)
}

export interface ExitStrategyInput {
  baseCost: number;      // 수익계산기준취득가 (대출이자 제외, 만원)
  myInvestment: number;  // 실투자금 (만원)
  salePrice: number;     // 매도 희망가 (만원)
  inputHoldMonths: number; // 입력한 단기 보유 개월수
}

// ── 3가지 출구전략 계산 ──────────────────────────────────
export function calcExitStrategies(input: ExitStrategyInput): ExitStrategyResult[] {
  const { baseCost, myInvestment, salePrice, inputHoldMonths } = input;

  const strategies: Array<{ label: string; holdMonths: number }> = [
    { label: "단기 매도",         holdMonths: Math.max(1, inputHoldMonths) },
    { label: "전세 후 2년 매도",  holdMonths: 24 },
    { label: "장기 보유 매도",    holdMonths: 36 },
  ];

  return strategies.map(({ label, holdMonths }) => {
    const brokerage  = calcBrokerage(salePrice);
    const grossProfit = salePrice - baseCost - brokerage;
    const taxAmount  = grossProfit > 0 ? calcCapitalGainsTax(grossProfit, holdMonths) : 0;
    const netProfit  = grossProfit - taxAmount;

    const hasLoan = myInvestment < baseCost;
    const baseROI = baseCost > 0 ? Math.round((netProfit / baseCost) * 1000) / 10 : 0;
    const netROI  = hasLoan && myInvestment > 0
      ? Math.round((netProfit / myInvestment) * 1000) / 10
      : baseROI;

    return { label, holdMonths, brokerage, grossProfit, taxAmount, netProfit, netROI, baseROI };
  });
}
