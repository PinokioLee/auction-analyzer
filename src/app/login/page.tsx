"use client";

import { createClient } from "@/lib/supabase/client";
import { OneWattLogoMark } from "@/components/ui/logo";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function KakaoLoginButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleKakaoLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p className="text-sm text-red-500">
          로그인 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
      )}
      <button
        onClick={handleKakaoLogin}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] px-5 py-3.5 text-[15px] font-semibold text-[#191919] transition-opacity hover:opacity-90 active:opacity-80"
      >
        <KakaoIcon />
        카카오로 계속하기
      </button>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.582 2 2 4.896 2 8.465c0 2.274 1.476 4.27 3.706 5.408L4.8 17.183a.25.25 0 00.37.27l4.31-2.864c.17.013.34.02.52.02 4.418 0 8-2.896 8-6.465C18 4.896 14.418 2 10 2z"
        fill="#191919"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* 로고 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <OneWattLogoMark size={40} />
          <div className="text-center">
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              경매 분석기
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              로그인하고 분석 결과를 저장하세요
            </p>
          </div>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Suspense
            fallback={
              <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-100" />
            }
          >
            <KakaoLoginButton />
          </Suspense>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-400">
            로그인 없이도 계산기·리포트를 이용할 수 있습니다.
            <br />
            저장 기능은 로그인 후 사용 가능합니다.
          </p>
        </div>

        {/* 비로그인 계속 */}
        <div className="mt-4 text-center">
          <a
            href="/dashboard/calculator"
            className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
          >
            로그인 없이 계산기 사용하기 →
          </a>
        </div>
      </div>
    </div>
  );
}
