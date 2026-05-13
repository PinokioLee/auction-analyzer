import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuctionInputForm } from "@/components/analyze/input-form";

export const metadata: Metadata = {
  title: "분석 입력 | 경매 분석기",
};

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors duration-150 hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        돌아가기
      </Link>

      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-zinc-900">
          경매 물건 분석
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
          경매 물건 정보를 입력하면 취득비용을 자동으로 계산합니다.
        </p>
      </div>

      <AuctionInputForm />
    </div>
  );
}
