import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn, formatManwon, formatKoreanWon } from "@/lib/utils";

export const metadata: Metadata = {
  title: "분석 결과 | 경매 분석기",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

// ── 공인중개사 수수료 계산 (아파트 매매, 2021년 개정 기준) ─
function calcBrokerage(salePriceManwon: number): number {
  const won = salePriceManwon * 10_000;
  let rate: number;
  let maxFee: number = Infinity;

  if (won < 50_000_000)        { rate = 0.006; maxFee = 250_000; }
  else if (won < 200_000_000)  { rate = 0.005; maxFee = 800_000; }
  else if (won < 900_000_000)  { rate = 0.004; }
  else if (won < 1_200_000_000){ rate = 0.005; }
  else if (won < 1_500_000_000){ rate = 0.006; }
  else                          { rate = 0.007; }

  const fee = Math.min(won * rate, maxFee);
  return Math.round(fee / 10_000); // 만원 단위
}

// ── 수익 계산 ──────────────────────────────────────
// 순수익 = 매도가 - (취득가 - 대출이자 - 중도상환수수료) - 공인중개사수수료
function calcProfit(
  salePrice: number,   // 만원
  baseCost: number,    // 만원 (대출이자/중도상환수수료 제외한 취득가)
): { profit: number; roi: number; brokerage: number } {
  const brokerage = calcBrokerage(salePrice);
  const profit    = salePrice - baseCost - brokerage;
  const roi       = baseCost > 0 ? Math.round((profit / baseCost) * 1000) / 10 : 0;
  return { profit, roi, brokerage };
}

// ── CostRow ────────────────────────────────────────

function CostRow({
  label, value, bold, indent,
}: {
  label: string; value: number; bold?: boolean; indent?: boolean;
}) {
  if (value === 0 && !bold) return null;
  return (
    <div className={cn("flex justify-between text-sm", indent && "pl-4")}>
      <span className={cn("text-zinc-600", bold && "font-semibold text-zinc-900", indent && "text-zinc-500")}>
        {label}
      </span>
      <span className={cn("tabular-nums", bold ? "font-bold text-zinc-900" : "text-zinc-700")}>
        {formatManwon(value)}
      </span>
    </div>
  );
}

// ── 수익률 배지 (작은) ─────────────────────────────

function ProfitBadge({
  label,
  salePrice,
  baseCost,
}: {
  label: string;
  salePrice: number;
  baseCost: number;
}) {
  if (salePrice === 0) {
    return (
      <div className="flex flex-col items-center gap-0.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
        <span className="text-[11px] font-medium text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-300">—</span>
      </div>
    );
  }

  const { profit, roi } = calcProfit(salePrice, baseCost);
  const positive = profit >= 0;

  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 min-w-0",
      positive
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50"
    )}>
      <span className={cn(
        "text-[11px] font-medium",
        positive ? "text-emerald-700" : "text-red-600"
      )}>
        {label}
      </span>
      <span className={cn(
        "tabular-nums text-sm font-bold leading-none",
        positive ? "text-emerald-700" : "text-red-600"
      )}>
        {positive ? "+" : ""}{roi}%
      </span>
      <span className={cn(
        "tabular-nums text-[11px]",
        positive ? "text-emerald-600" : "text-red-500"
      )}>
        {positive ? "+" : ""}{formatManwon(profit)}
      </span>
    </div>
  );
}

// ── 층별 시세 카드 ─────────────────────────────────

function PriceCard({
  label,
  marketPrice,
  baseCost,
}: {
  label: string;
  marketPrice: number;
  baseCost: number;
}) {
  if (marketPrice === 0) {
    return (
      <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <p className="mt-2 text-xs text-zinc-400">데이터 없음</p>
      </div>
    );
  }

  const { profit, roi, brokerage } = calcProfit(marketPrice, baseCost);
  const positive = profit >= 0;

  return (
    <div className={cn(
      "flex-1 rounded-xl border p-4 transition-all duration-200",
      positive ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
    )}>
      <p className="text-xs font-medium text-zinc-500">{label} 시세</p>
      <p className="tabular-nums mt-1.5 text-[17px] font-bold text-zinc-900">
        {formatKoreanWon(marketPrice)}
      </p>
      {/* 수익 */}
      <div className="mt-2 flex items-center gap-1">
        {positive
          ? <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          : <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
        }
        <span className={cn(
          "tabular-nums text-xs font-semibold",
          positive ? "text-emerald-700" : "text-red-600"
        )}>
          {positive ? "+" : ""}{formatManwon(profit)}
        </span>
        <span className={cn(
          "tabular-nums text-xs",
          positive ? "text-emerald-600" : "text-red-500"
        )}>
          ({positive ? "+" : ""}{roi}%)
        </span>
      </div>
      {/* 중개수수료 */}
      <p className="tabular-nums mt-1 text-[11px] text-zinc-400">
        중개수수료 {formatManwon(brokerage)}
      </p>
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
    dataCount: number; period: string; dataSource?: string;
  } | null;

  const totalCost      = row.total_cost ?? row.bid_price;
  const acquisitionTax = row.acquisition_tax ?? 0;
  const hasPrice       = priceAnalysis && priceAnalysis.dataCount > 0;

  // 순취득가: 대출이자 + 중도상환수수료는 매도 수익 계산에서 제외
  const loanInterest       = row.loan_interest ?? 0;
  const prepaymentPenalty  = row.prepayment_penalty ?? 0;
  const baseCost           = totalCost - loanInterest - prepaymentPenalty;

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

      {/* 최종 취득가 + 수익률 요약 */}
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md">

        {/* 상단: 취득가 정보 */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">최종 취득가 (예상)</p>
            <p className="tabular-nums mt-1 text-[38px] font-bold leading-none tracking-[-0.03em] text-zinc-900">
              {formatKoreanWon(totalCost)}
            </p>
            <p className="tabular-nums mt-1.5 text-xs text-zinc-400">
              입찰가 {formatKoreanWon(row.bid_price)} + 부대비용 {formatKoreanWon(totalCost - row.bid_price)}
            </p>
          </div>
        </div>

        {/* 구분선 */}
        {hasPrice && (
          <>
            <div className="my-4 border-t border-zinc-100" />

            {/* 수익률 요약 — 저/중/고층 */}
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Minus className="h-3 w-3" />
                매도 시 예상 수익 (취득가 기준, 부동산 수수료 제외 후)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <ProfitBadge label="저층" salePrice={priceAnalysis.low}  baseCost={baseCost} />
                <ProfitBadge label="중층" salePrice={priceAnalysis.mid}  baseCost={baseCost} />
                <ProfitBadge label="고층" salePrice={priceAnalysis.high} baseCost={baseCost} />
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                * 수익 = 매도가 − 취득가 − 중개수수료 (대출이자·중도상환수수료 별도)
              </p>
            </div>
          </>
        )}
      </div>

      {/* 층별 시세 분석 */}
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
          <div className="flex gap-2">
            <PriceCard label="저층" marketPrice={priceAnalysis.low}  baseCost={baseCost} />
            <PriceCard label="중층" marketPrice={priceAnalysis.mid}  baseCost={baseCost} />
            <PriceCard label="고층" marketPrice={priceAnalysis.high} baseCost={baseCost} />
          </div>
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
              <CostRow label="법무사 비용"    value={row.legal_fee ?? 0}          indent />
              <CostRow label="명도비용"       value={row.eviction_cost ?? 0}       indent />
              <CostRow label="미납관리비"     value={row.unpaid_maintenance ?? 0}  indent />
              <CostRow label="인테리어 비용"  value={row.interior_cost ?? 0}       indent />
              <CostRow label="대출이자 (1년)" value={loanInterest}                 indent />
              <CostRow label="대출수수료"     value={row.loan_fee ?? 0}            indent />
              <CostRow label="중도상환수수료" value={prepaymentPenalty}            indent />
              <CostRow label="강제집행 비용"  value={row.enforcement_cost ?? 0}    indent />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <CostRow label="최종 취득가" value={totalCost} bold />
          </div>

          {/* 수익 계산 기준 취득가 별도 표시 */}
          {(loanInterest > 0 || prepaymentPenalty > 0) && (
            <div className="rounded-lg bg-zinc-50 px-3 py-2.5">
              <p className="text-xs text-zinc-500">
                수익률 계산 기준 취득가{" "}
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
