import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecordForm } from "@/components/field-records/record-form";
import type { Memo } from "@/components/field-records/record-form";

export const metadata: Metadata = {
  title: "임장 기록 수정 | 경매 분석기",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFieldRecordPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rec } = await supabase
    .from("field_records")
    .select("*")
    .eq("id", id)
    .single();

  if (!rec) notFound();

  const initialData = {
    case_number:    rec.case_number    ?? undefined,
    bid_date:       rec.bid_date       ?? undefined,
    lawd_cd:        rec.lawd_cd        ?? undefined,
    apt_name:       rec.apt_name ?? undefined,
    exclusive_area: rec.exclusive_area ?? undefined,
    memo:           (rec.memo ?? {}) as Memo,
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        href={`/dashboard/field-records/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        상세로
      </Link>

      <div className="mb-8">
        <h1 className="text-[24px] font-bold tracking-tight text-zinc-900">임장 기록 수정</h1>
        <p className="mt-1 text-sm text-zinc-500">{rec.apt_name}</p>
      </div>

      <RecordForm mode="edit" recordId={id} initialData={initialData} />
    </div>
  );
}
