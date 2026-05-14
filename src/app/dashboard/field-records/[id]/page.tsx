import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Hash, CalendarDays, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { naverMapUrl, naverAgentUrl } from "@/lib/utils/naver-link";
import { deleteFieldRecord } from "../actions";

export const metadata: Metadata = {
  title: "임장 기록 상세 | 경매 분석기",
};

const MEMO_LABELS: Record<string, string> = {
  atmosphere: "단지 분위기",
  parking:    "주차",
  noise:      "소음",
  management: "관리 상태",
  repair:     "수리 필요",
  call:       "통화 내용",
  verdict:    "최종 판단",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FieldRecordDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rec } = await supabase
    .from("field_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id ?? "")
    .single();

  if (!rec) notFound();

  const memo = (rec.memo ?? {}) as Record<string, string>;
  const memoEntries = Object.entries(MEMO_LABELS)
    .map(([key, label]) => ({ key, label, value: memo[key] ?? "" }))
    .filter(({ value }) => value.trim().length > 0);

  const aptName  = rec.apt_name ?? "";
  const mapUrl   = naverMapUrl(aptName);
  const agentUrl = naverAgentUrl(aptName);

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* 뒤로 */}
      <Link
        href="/dashboard/field-records"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        목록으로
      </Link>

      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              {aptName}
              {rec.exclusive_area && (
                <span className="ml-2 text-[15px] font-normal text-zinc-400">
                  {rec.exclusive_area}㎡
                </span>
              )}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-zinc-400">
              {rec.case_number && (
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {rec.case_number}
                </span>
              )}
              {rec.bid_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {rec.bid_date}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 수정 버튼 */}
        <Link
          href={`/dashboard/field-records/${id}/edit`}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Link>
      </div>

      {/* 네이버 링크 */}
      <div className="mb-6 flex gap-2">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-[#03C75A] px-3.5 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
        >
          네이버 지도
        </a>
        <a
          href={agentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          인근 중개사 검색
        </a>
      </div>

      {/* 메모 */}
      {memoEntries.length > 0 ? (
        <div className="space-y-4">
          {memoEntries.map(({ key, label, value }) => (
            <div
              key={key}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
                {label}
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-800">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-14 text-center">
          <p className="text-sm text-zinc-400">작성된 메모가 없습니다.</p>
        </div>
      )}

      {/* 삭제 */}
      <div className="mt-8 border-t border-zinc-100 pt-6">
        <form action={deleteFieldRecord.bind(null, id)}>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm text-red-400 transition hover:bg-red-50 hover:text-red-600"
          >
            이 기록 삭제
          </button>
        </form>
      </div>
    </div>
  );
}
