"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "feature", label: "기능 요청" },
  { value: "bug",     label: "버그 제보" },
  { value: "data",    label: "데이터" },
  { value: "other",   label: "UI/UX · 기타" },
];

interface Props {
  userId: string;
}

export function FeedbackForm({ userId }: Props) {
  const router  = useRouter();
  const [open,     setOpen]     = useState(false);
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [category, setCategory] = useState("feature");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400";
  const labelCls = "mb-1.5 block text-[12px] font-medium text-zinc-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("feature_requests").insert({
        user_id:  userId,
        title:    title.trim(),
        body:     body.trim() || null,
        category,
        status:   "open",
      });
      if (err) throw err;
      setTitle("");
      setBody("");
      setCategory("feature");
      setOpen(false);
      router.refresh();
    } catch {
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-3.5 text-sm font-medium text-zinc-500 transition hover:border-zinc-400 hover:bg-white hover:text-zinc-800"
      >
        <Plus className="h-4 w-4" />
        요청사항 작성하기
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 text-[14px] font-semibold text-zinc-700">요청사항 작성</h3>

      <div className="space-y-3">
        <div>
          <label className={labelCls}>분류</label>
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>
            제목 <span className="text-red-400">*</span>
          </label>
          <input
            className={inputCls}
            placeholder="요청 내용을 간략하게..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>상세 내용 (선택)</label>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="자세한 내용이 있다면 적어주세요..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); }}
          className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          등록
        </button>
      </div>
    </form>
  );
}
