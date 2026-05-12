import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
          aria-label="경매 분석기 홈"
        >
          경매 분석기
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/analyze"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            분석하기
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
