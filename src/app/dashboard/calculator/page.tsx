import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuctionInputForm } from "@/components/analyze/input-form";

export const metadata: Metadata = {
  title: "경매 수익률 계산기 | 경매 분석기",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-[640px] py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors duration-150 hover:text-zinc-700"
      >
        <ChevronLeft className="h-4 w-4" />
        대시보드
      </Link>

      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-zinc-900">
          경매 수익률 계산기
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
          경매 물건 정보를 입력하면 취득비용과 출구전략별 수익률을 계산합니다.
        </p>
      </div>

      <AuctionInputForm />
    </div>
  );
}
