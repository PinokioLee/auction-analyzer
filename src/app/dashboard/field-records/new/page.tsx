import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RecordForm } from "@/components/field-records/record-form";

export const metadata: Metadata = {
  title: "임장 기록 작성 | 경매 분석기",
};

export default function NewFieldRecordPage() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        href="/dashboard/field-records"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        목록으로
      </Link>

      <div className="mb-8">
        <h1 className="text-[24px] font-bold tracking-tight text-zinc-900">임장 기록 작성</h1>
        <p className="mt-1 text-sm text-zinc-500">현장 방문 결과를 기록해두세요</p>
      </div>

      <RecordForm mode="new" />
    </div>
  );
}
