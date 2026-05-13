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

// ── 헬퍼 ─────────────────────────────────────────

function CostRow({
  label,
  value,
  bold,
  indent,
}: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
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

// ── 층별 시세 카드 ─────────────────────────────────

function PriceCard({
  label,
  marketPrice,
  totalCost,
}: {
  label: string;
  marketPrice: number;
  totalCost: number;
}) {
  if (marketPrice === 0) {
    return (
      <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <p className="mt-2 text-xs text-zinc-400">데이터 없음</p>
      </div>
    );
  }

  const profit = marketPrice - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 1000) / 10 : 0;
  const positive = profit >= 0;

  return (
    <div className={cn(
      "flex-1 rounded-xl border p-4 transition-all duration-200",
      positive
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50"
    )}>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="tabular-nums mt-1.5 text-[17px] font-bold text-zinc-900">
        {formatKoreanWon(marketPrice)}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {positive
          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
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

  const totalCost = row.total_cost ?? row.bid_price;
  const acquisitionTax = row.acquisition_tax ?? 0;
  const hasPrice = priceAnalysis && priceAnalysis.dataCount > 0;

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
        <p className="tabular-nums mt-1.5 text-sm text-zinc-400">
          입찰가 {formatKoreanWon(row.bid_price)} + 부대비용 {formatKoreanWon(totalCost - row.bid_price)}
        </p>
      </div>

      {/* 층별 시세 분석 */}
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">시세 분석</h2>
          {hasPrice && priceAnalysis.period && (
            <p className="text-xs text-zinc-400">
              {priceAnalysis.period} · {priceAnalysis.dataCount}건
            </p>
          )}
        </div>

        {hasPrice ? (
          <div className="flex gap-2">
            <PriceCard label="저층" marketPrice={priceAnalysis.low}  totalCost={totalCost} />
            <PriceCard label="중층" marketPrice={priceAnalysis.mid}  totalCost={totalCost} />
            <PriceCard label="고층" marketPrice={priceAnalysis.high} totalCost={totalCost} />
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
              <CostRow label="법무사 비용"     value={row.legal_fee ?? 0}           indent />
              <CostRow label="명도비용"        value={row.eviction_cost ?? 0}        indent />
              <CostRow label="미납관리비"      value={row.unpaid_maintenance ?? 0}   indent />
              <CostRow label="인테리어 비용"   value={row.interior_cost ?? 0}        indent />
              <CostRow label="대출이자 (1년)"  value={row.loan_interest ?? 0}        indent />
              <CostRow label="대출수수료"      value={row.loan_fee ?? 0}             indent />
              <CostRow label="중도상환수수료"  value={row.prepayment_penalty ?? 0}   indent />
              <CostRow label="강제집행 비용"   value={row.enforcement_cost ?? 0}     indent />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <CostRow label="최종 취득가" value={totalCost} bold />
          </div>
        </div>
      </div>

    </div>
  );
}
