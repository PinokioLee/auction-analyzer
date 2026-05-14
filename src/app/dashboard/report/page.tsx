import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Calculator, ChevronRight, CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "분석 기록 | 경매 분석기",
};

function fmt(manwon: number) {
  if (manwon >= 10_000) return `${(manwon / 10_000).toFixed(1)}억`;
  return `${manwon.toLocaleString()}만`;
}

function profitColor(profit: number) {
  if (profit > 0) return "text-emerald-600";
  if (profit < 0) return "text-red-500";
  return "text-zinc-500";
}

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-zinc-500">로그인 후 분석 기록을 확인할 수 있습니다.</p>
        <Link
          href="/login"
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          로그인
        </Link>
      </div>
    );
  }

  const { data: records } = await supabase
    .from("profit_calculations")
    .select("id, apt_name, exclusive_area, input_data, result_data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">분석 기록</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {records?.length ?? 0}개의 계산기 기록
        </p>
      </div>

      {(!records || records.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-20 text-center">
          <Calculator className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">아직 분석 기록이 없습니다</p>
          <p className="mt-1 text-xs text-zinc-400">계산기에서 분석하면 여기에 쌓입니다</p>
          <Link
            href="/dashboard/calculator"
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            계산기로 이동
          </Link>
        </div>
      )}

      {records && records.length > 0 && (
        <div className="flex flex-col gap-3">
          {records.map((rec) => {
            const input  = rec.input_data  as Record<string, number> | null;
            const result = rec.result_data as Record<string, number | Record<string, number>> | null;
            const bidPrice  = input?.bidPrice  ?? 0;
            const totalCost = typeof result?.totalCost === "number" ? result.totalCost : 0;
            const pa = result?.priceAnalysis;
            const midPrice = typeof pa === "object" && pa !== null && "mid" in pa && typeof pa.mid === "number"
              ? pa.mid
              : 0;
            const midProfit = midPrice - totalCost;

            const dateStr = rec.created_at
              ? new Date(rec.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                })
              : "";

            return (
              <div
                key={rec.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <Calculator className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-zinc-900">
                        {rec.apt_name ?? "—"}
                        {rec.exclusive_area && (
                          <span className="ml-1.5 text-[13px] font-normal text-zinc-400">
                            {rec.exclusive_area}㎡
                          </span>
                        )}
                      </p>
                      {dateStr && (
                        <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                          <CalendarDays className="h-3 w-3" />
                          {dateStr}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-zinc-400">입찰가</p>
                    <p className="text-[14px] font-semibold text-zinc-800">
                      {fmt(bidPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 p-3 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-[11px] text-zinc-400">총 취득비용</p>
                    <p className="text-[13px] font-semibold text-zinc-700">{fmt(totalCost)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-zinc-400">예상 시세차익 (중간)</p>
                    <p className={`text-[13px] font-semibold ${profitColor(midProfit)}`}>
                      {midProfit > 0 ? "+" : ""}{midPrice > 0 ? fmt(midProfit) : "—"}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center sm:col-span-1">
                    <Link
                      href="/dashboard/calculator"
                      className="flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-700"
                    >
                      다시 분석
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
