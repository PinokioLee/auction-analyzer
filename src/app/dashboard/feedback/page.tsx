import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "요청사항 게시판 | 경매 분석기",
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: "검토중",  cls: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "진행중",  cls: "bg-blue-50 text-blue-600" },
  done:        { label: "완료",    cls: "bg-emerald-50 text-emerald-600" },
};

const CATEGORY_MAP: Record<string, string> = {
  feature: "기능 요청",
  bug:     "버그 제보",
  data:    "데이터",
  other:   "기타",
};

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("feature_requests")
    .select("id, user_id, title, body, category, status, like_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">요청사항 게시판</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          기능 요청, 버그 제보, 개선 아이디어를 남겨주세요
        </p>
      </div>

      {/* 작성 폼 */}
      {user ? (
        <FeedbackForm userId={user.id} />
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 text-center text-sm text-zinc-400">
          <a href="/login" className="text-zinc-600 underline underline-offset-2">로그인</a>하면 요청사항을 작성할 수 있습니다.
        </div>
      )}

      {/* 목록 */}
      {(!posts || posts.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <MessageSquare className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">아직 등록된 요청이 없습니다</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {posts.map((post) => {
            const status = STATUS_MAP[post.status ?? "open"] ?? STATUS_MAP.open;
            const category = CATEGORY_MAP[post.category ?? "other"] ?? post.category;
            const dateStr = post.created_at
              ? new Date(post.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                })
              : "";
            const isMine = user?.id === post.user_id;

            return (
              <div
                key={post.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                      {category && (
                        <span className="text-[11px] text-zinc-400">{category}</span>
                      )}
                      {isMine && (
                        <span className="text-[11px] text-zinc-300">내 글</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[15px] font-semibold text-zinc-900">{post.title}</p>
                    {post.body && (
                      <p className="mt-1 line-clamp-2 text-[13px] text-zinc-500">{post.body}</p>
                    )}
                    <p className="mt-2 text-[11px] text-zinc-300">{dateStr}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-0.5 text-zinc-400">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-[12px] font-medium">{post.like_count ?? 0}</span>
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
