import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-70"
          aria-label="경매 분석기 홈"
        >
          {/* 로고 마크 */}
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-bold text-white">
            경
          </span>
          경매 분석기
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
