import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn, formatManwon, formatKoreanWon } from "@/lib/utils";

export const metadata: Metadata = {
  title: "분석 결과 | 경매 분석기",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

// ── 공인중개사 수수료 (2021년 개정, 아파트 매매) ──
function calcBrokerage(salePriceManwon: number): number {
  const won = salePriceManwon * 10_000;
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

// ── CostRow ────────────────────────────────────────

function CostRow({
  label, value, bold, indent, detail,
}: {
  label: string; value: number; bold?: boolean; indent?: boolean; detail?: string;
}) {
  if (value === 0 && !bold) return null;
  return (
    <div className={cn(indent && "pl-4")}>
      <div className="flex justify-between text-sm">
        <span className={cn("text-zinc-600", bold && "font-semibold text-zinc-900", indent && "text-zinc-500")}>
          {label}
        </span>
        <span className={cn("tabular-nums", bold ? "font-bold text-zinc-900" : "text-zinc-700")}>
          {formatManwon(value)}
        </span>
      </div>
      {detail && (
        <p className="tabular-nums mt-0.5 text-[11px] text-zinc-400">{detail}</p>
      )}
    </div>
  );
}

// ── 시세 카드 ─────────────────────────────────────

function PriceCard({
  label,
  marketPrice,
  minPrice,
  maxPrice,
  count,
  baseCost,
  myInvestment,
}: {
  label: string;
  marketPrice: number;  // 평균가 (수익 계산 기준)
  minPrice: number;
  maxPrice: number;
  count: number;
  baseCost: number;
  myInvestment: number;
}) {
  if (marketPrice === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-zinc-400">{label} 시세</p>
        <p className="mt-1 text-xs text-zinc-400">거래 데이터 없음</p>
      </div>
    );
  }

  const brokerage     = calcBrokerage(marketPrice);
  const profit        = marketPrice - baseCost - brokerage;
  const positive      = profit >= 0;
  const hasLoan       = myInvestment < baseCost;
  const investmentROI = myInvestment > 0
    ? Math.round((profit / myInvestment) * 1000) / 10
    : null;
  const baseROI = Math.round((profit / baseCost) * 1000) / 10;

  const colorText = positive ? "text-red-600" : "text-blue-600";
  const colorSub  = positive ? "text-red-400" : "text-blue-400";

  return (
    <div className={cn(
      "rounded-xl border px-4 py-3",
      positive ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
    )}>
      <div className="flex items-start gap-2">

        {/* 왼쪽: 층 구분 + 저가/평균/고가 */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-500 mb-1">
            {label} 시세
            <span className="ml-1 text-zinc-400">· {count}건</span>
          </p>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 w-7 shrink-0">저가</span>
              <span className="tabular-nums text-[12px] text-zinc-600">
                {formatKoreanWon(minPrice)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 w-7 shrink-0 font-medium">평균</span>
              <span className="tabular-nums text-[14px] font-bold text-zinc-900">
                {formatKoreanWon(marketPrice)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 w-7 shrink-0">고가</span>
              <span className="tabular-nums text-[12px] text-zinc-600">
                {formatKoreanWon(maxPrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-16 w-px bg-black/10 shrink-0 self-center" />

        {/* 수익 */}
        <div className="text-right shrink-0 self-center">
          <p className="text-[10px] text-zinc-400">수익(평균)</p>
          <p className={cn("tabular-nums text-[13px] font-bold", colorText)}>
            {positive ? "+" : ""}{formatManwon(profit)}
          </p>
        </div>

        <div className="h-16 w-px bg-black/10 shrink-0 self-center" />

        {/* 수익률 */}
        <div className="text-right shrink-0 self-center">
          <p className="text-[10px] text-zinc-400">
            {hasLoan && investmentROI !== null ? "투자금대비" : "수익률"}
          </p>
          <p className={cn("tabular-nums text-[16px] font-bold", colorText)}>
            {positive ? "+" : ""}
            {hasLoan && investmentROI !== null ? investmentROI : baseROI}%
          </p>
          {hasLoan && investmentROI !== null && (
            <p className={cn("tabular-nums text-[10px]", colorSub)}>
              취득가 {positive ? "+" : ""}{baseROI}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 결과 없음 ─────────────────────────────────────

function NotFound({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
      <p className="text-zinc-500">{message}</p>
      <Link
        href="/analyze"
        className="mt-6 inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
      >
        돌아가기
      </Link>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────

export default async function ResultPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) return <NotFound message="분석 결과를 찾을 수 없습니다." />;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) return <NotFound message="분석 데이터가 존재하지 않습니다." />;

  const priceAnalysis = row.price_analysis as {
    low: number; mid: number; high: number;
    lowMin: number; lowMax: number; lowCount: number;
    midMin: number; midMax: number; midCount: number;
    highMin: number; highMax: number; highCount: number;
    dataCount: number; period: string; dataSource?: string;
    holdMonths?: number; loanRate?: number;
  } | null;

  const totalCost          = row.total_cost ?? row.bid_price;
  const acquisitionTax     = row.acquisition_tax ?? 0;
  const loanInterest       = row.loan_interest ?? 0;
  const prepaymentPenalty  = row.prepayment_penalty ?? 0;
  const loanAmount         = row.loan_amount ?? 0;
  const evictionCost       = row.eviction_cost ?? 0;
  const hasPrice           = priceAnalysis && priceAnalysis.dataCount > 0;

  // 수익 계산 기준 취득가 (대출이자·중도상환수수료 제외)
  const baseCost = totalCost - loanInterest - prepaymentPenalty;
  // 실투자금 = 취득가 - 대출금액
  const myInvestment = totalCost - loanAmount;

  // 명도비용 breakdown (평당 역산)
  const areaPyeong      = Math.round(row.area * 0.3025 * 10) / 10;
  const evictionPerPyeong = areaPyeong > 0 && evictionCost > 0
    ? Math.round(evictionCost / areaPyeong)
    : 0;

  // 대출이자 breakdown
  const holdMonths    = priceAnalysis?.holdMonths ?? 0;
  const monthlyInterest = holdMonths > 0 && loanInterest > 0
    ? Math.round(loanInterest / holdMonths)
    : 0;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">

      {/* 뒤로가기 */}
      <Link
        href="/analyze"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors duration-150 hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        다시 분석하기
      </Link>

      {/* 물건 헤더 */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-tight text-zinc-900">
          {row.apartment_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          전용 {row.area}㎡ · 입찰가 {formatKoreanWon(row.bid_price)}
        </p>
      </div>

      {/* 최종 취득가 카드 */}
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">
        <p className="text-sm text-zinc-500">최종 취득가 (예상)</p>
        <p className="tabular-nums mt-1 text-[38px] font-bold leading-none tracking-[-0.03em] text-zinc-900">
          {formatKoreanWon(totalCost)}
        </p>
        <p className="tabular-nums mt-1.5 text-xs text-zinc-400">
          입찰가 {formatKoreanWon(row.bid_price)} + 부대비용 {formatKoreanWon(totalCost - row.bid_price)}
        </p>

        {/* 실투자금 (대출이 있을 때만) */}
        {loanAmount > 0 && (
          <div className="mt-4 flex items-center gap-6 rounded-xl bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-[11px] text-zinc-400">대출금액</p>
              <p className="tabular-nums mt-0.5 text-sm font-semibold text-zinc-700">
                {formatKoreanWon(loanAmount)}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-[11px] text-zinc-400">실투자금</p>
              <p className="tabular-nums mt-0.5 text-sm font-bold text-zinc-900">
                {formatKoreanWon(myInvestment)}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-[11px] text-zinc-400">LTV</p>
              <p className="tabular-nums mt-0.5 text-sm font-semibold text-zinc-700">
                {Math.round((loanAmount / row.bid_price) * 100)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 시세별 수익 분석 */}
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">시세별 수익 분석</h2>
          {hasPrice && priceAnalysis.period && (
            <p className="text-xs text-zinc-400">
              {priceAnalysis.period} · {priceAnalysis.dataCount}건
            </p>
          )}
        </div>

        {hasPrice ? (
          <>
            <div className="flex flex-col gap-2">
              {(priceAnalysis.lowCount ?? 0) > 0 && (
                <PriceCard
                  label="저층"
                  marketPrice={priceAnalysis.low}
                  minPrice={priceAnalysis.lowMin ?? 0}
                  maxPrice={priceAnalysis.lowMax ?? 0}
                  count={priceAnalysis.lowCount ?? 0}
                  baseCost={baseCost}
                  myInvestment={myInvestment}
                />
              )}
              {(priceAnalysis.midCount ?? 0) > 0 && (
                <PriceCard
                  label="중층"
                  marketPrice={priceAnalysis.mid}
                  minPrice={priceAnalysis.midMin ?? 0}
                  maxPrice={priceAnalysis.midMax ?? 0}
                  count={priceAnalysis.midCount ?? 0}
                  baseCost={baseCost}
                  myInvestment={myInvestment}
                />
              )}
              {(priceAnalysis.highCount ?? 0) > 0 && (
                <PriceCard
                  label="고층"
                  marketPrice={priceAnalysis.high}
                  minPrice={priceAnalysis.highMin ?? 0}
                  maxPrice={priceAnalysis.highMax ?? 0}
                  count={priceAnalysis.highCount ?? 0}
                  baseCost={baseCost}
                  myInvestment={myInvestment}
                />
              )}
            </div>
            <p className="mt-3 text-[11px] text-zinc-400">
              * 수익 = 매도가 − 취득가 − 중개수수료 (대출이자·중도상환수수료 별도)
              {loanAmount > 0 && " · 투자금 대비 수익률은 실투자금 기준"}
            </p>
          </>
        ) : (
          <div className="rounded-xl bg-zinc-50 px-4 py-5">
            <p className="text-sm text-zinc-500">해당 단지·평형의 최근 6개월 실거래 데이터가 없습니다.</p>
            <p className="mt-1 text-xs text-zinc-400">백필이 완료되면 자동으로 조회됩니다.</p>
          </div>
        )}
      </div>

      {/* 취득 비용 상세 */}
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-zinc-900">취득 비용 상세</h2>

        <div className="space-y-2.5">
          <CostRow label="입찰가" value={row.bid_price} bold />

          <div className="border-t border-zinc-100 pt-2.5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">취득세</p>
            <div className="space-y-2">
              <CostRow label="취득세 합계" value={acquisitionTax} indent />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-2.5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">부대비용</p>
            <div className="space-y-2">
              <CostRow label="법무사 비용"    value={row.legal_fee ?? 0}         indent />
              <CostRow
                label="명도비용(평당)"
                value={evictionCost}
                indent
                detail={evictionPerPyeong > 0
                  ? `${areaPyeong}평 × ${evictionPerPyeong}만원/평`
                  : undefined}
              />
              <CostRow label="미납관리비"     value={row.unpaid_maintenance ?? 0} indent />
              <CostRow label="인테리어 비용"  value={row.interior_cost ?? 0}      indent />
              <CostRow
                label="대출이자"
                value={loanInterest}
                indent
                detail={monthlyInterest > 0 && holdMonths > 0
                  ? `월 ${monthlyInterest.toLocaleString()}만원 × ${holdMonths}개월`
                  : undefined}
              />
              <CostRow label="대출수수료"     value={row.loan_fee ?? 0}           indent />
              <CostRow label="중도상환수수료" value={prepaymentPenalty}           indent />
              <CostRow label="강제집행 비용"  value={row.enforcement_cost ?? 0}   indent />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <CostRow label="최종 취득가" value={totalCost} bold />
          </div>

          {(loanInterest > 0 || prepaymentPenalty > 0) && (
            <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
              <p className="text-xs text-zinc-500">
                수익 계산 기준 취득가{" "}
                <span className="tabular-nums font-semibold text-zinc-700">
                  {formatManwon(baseCost)}
                </span>
                <span className="ml-1 text-zinc-400">
                  (대출이자·중도상환수수료 {formatManwon(loanInterest + prepaymentPenalty)} 제외)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
