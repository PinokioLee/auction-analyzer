import Link from "next/link";
import { OneWattLogoMark } from "@/components/ui/logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
          aria-label="1Watt 홈"
        >
          <OneWattLogoMark size={28} />
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">
            1Watt
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/analyze"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900"
          >
            분석하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
