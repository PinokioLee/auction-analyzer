import Link from "next/link";
import { type ReactNode } from "react";
import {
  Calculator,
  MapPin,
  BarChart2,
  Receipt,
  MessageSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/calculator", label: "계산기", icon: Calculator },
  { href: "/dashboard/field-records", label: "임장기록", icon: MapPin },
  { href: "/dashboard/report", label: "리포트", icon: BarChart2 },
  { href: "/dashboard/tax", label: "세금", icon: Receipt },
  { href: "/dashboard/feedback", label: "게시판", icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* 서브 네비게이션 */}
      <nav className="flex items-center gap-0.5 border-b border-zinc-100 py-1.5 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 페이지 콘텐츠 */}
      <div>{children}</div>
    </div>
  );
}
