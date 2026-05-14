import Link from "next/link";
import { OneWattLogoMark } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/logout-button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
          aria-label="1Watt 홈"
        >
          <OneWattLogoMark size={28} />
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">
            1Watt
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900"
              >
                대시보드
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/dashboard/calculator"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900"
              >
                계산기
              </Link>
              <Link
                href="/login"
                className="ml-1 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                로그인
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
