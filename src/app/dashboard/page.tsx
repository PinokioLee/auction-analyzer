import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  MapPin,
  BarChart2,
  Receipt,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "대시보드 | 경매 분석기",
};

const MENU_ITEMS = [
  {
    href: "/dashboard/calculator",
    icon: Calculator,
    label: "경매 수익률 계산기",
    desc: "입찰가 입력 → 취득비용·시세 분석·출구전략 수익률 비교",
    color: "bg-blue-50 text-blue-600",
    badge: null,
  },
  {
    href: "/dashboard/field-records",
    icon: MapPin,
    label: "임장/분석 기록실",
    desc: "사건번호·입찰기일·현장메모를 한 곳에 기록",
    color: "bg-emerald-50 text-emerald-600",
    badge: "NEW",
  },
  {
    href: "/dashboard/report",
    icon: BarChart2,
    label: "아파트 분석 리포트",
    desc: "3년 매매가 추이·거래량·전세가율·주변 단지 비교",
    color: "bg-violet-50 text-violet-600",
    badge: "NEW",
  },
  {
    href: "/dashboard/tax",
    icon: Receipt,
    label: "세금 시뮬레이터",
    desc: "일반개인 / 매매사업자 양도세·종부세 참고용 계산",
    color: "bg-amber-50 text-amber-600",
    badge: "NEW",
  },
  {
    href: "/dashboard/feedback",
    icon: MessageSquare,
    label: "요청사항 게시판",
    desc: "기능 제안·데이터 요청·버그 신고",
    color: "bg-rose-50 text-rose-600",
    badge: null,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "사용자";

  return (
    <div className="py-8">
      {/* 인사 */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">
          안녕하세요, {displayName}님
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          분석하고 싶은 메뉴를 선택하세요
        </p>
      </div>

      {/* 메뉴 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {MENU_ITEMS.map(({ href, icon: Icon, label, desc, color, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
          >
            {/* 아이콘 */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* 텍스트 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-zinc-900">
                  {label}
                </span>
                {badge && (
                  <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">
                {desc}
              </p>
            </div>

            {/* 화살표 */}
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
