import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, MapPin, ChevronRight, CalendarDays, Hash } from "lucide-react";

export const metadata: Metadata = {
  title: "임장/분석 기록실 | 경매 분석기",
};

interface Memo {
  verdict?: string;
}

export default async function FieldRecordsPage() {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("field_records")
    .select("id, case_number, bid_date, apt_name, exclusive_area, memo, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">임장/분석 기록실</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {records?.length ?? 0}개의 기록
          </p>
        </div>
        <Link
          href="/dashboard/field-records/new"
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
          새 기록
        </Link>
      </div>

      {/* 기록 없음 */}
      {(!records || records.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-20 text-center">
          <MapPin className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">아직 임장 기록이 없습니다</p>
          <p className="mt-1 text-xs text-zinc-400">새 기록을 작성해보세요</p>
          <Link
            href="/dashboard/field-records/new"
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-3.5 w-3.5" />
            첫 기록 작성
          </Link>
        </div>
      )}

      {/* 목록 */}
      {records && records.length > 0 && (
        <div className="flex flex-col gap-3">
          {records.map((rec) => {
            const memo = rec.memo as Memo | null;
            const verdict = memo?.verdict;

            return (
              <Link
                key={rec.id}
                href={`/dashboard/field-records/${rec.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                {/* 아이콘 */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>

                {/* 내용 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-zinc-900">
                    {rec.apt_name}
                    {rec.exclusive_area && (
                      <span className="ml-1.5 text-[13px] font-normal text-zinc-400">
                        {rec.exclusive_area}㎡
                      </span>
                    )}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {rec.case_number && (
                      <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                        <Hash className="h-3 w-3" />
                        {rec.case_number}
                      </span>
                    )}
                    {rec.bid_date && (
                      <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                        <CalendarDays className="h-3 w-3" />
                        {rec.bid_date}
                      </span>
                    )}
                  </div>

                  {verdict && (
                    <p className="mt-1.5 line-clamp-1 text-[12px] text-zinc-500">
                      💬 {verdict}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
