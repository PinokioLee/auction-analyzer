import type { Metadata } from "next";
import Link from "next/link";
import { AuctionInputForm } from "@/components/analyze/input-form";
import { Calculator, TrendingUp, Receipt, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "아파트 경매 수익률 계산기 | 경매 분석기",
  description:
    "아파트 경매 입찰가 분석 도구. 취득세, 법무사 비용, 대출이자를 포함한 실제 취득비용과 층별 시세 대비 수익률을 자동 계산합니다.",
  keywords: ["아파트 경매", "경매 수익률 계산기", "경매 취득세", "입찰가 분석", "경매 분석"],
  openGraph: {
    title: "아파트 경매 수익률 계산기",
    description: "취득세, 법무사비, 대출이자를 포함한 실제 경매 수익률 자동 계산",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: TrendingUp,
    title: "실거래가 기반 시세 분석",
    desc: "국토부 실거래가 데이터로 저층·중층·고층별 평균 시세를 자동 조회합니다.",
  },
  {
    icon: Receipt,
    title: "취득비용 자동 계산",
    desc: "취득세(농어촌특별세·교육세 포함), 법무사 비용, 명도비, 미납관리비를 한번에 계산합니다.",
  },
  {
    icon: BarChart3,
    title: "출구전략별 수익률",
    desc: "단기 매도·전세 후 매도·장기 보유 시나리오별 세후 실수익률을 비교합니다.",
  },
];

export default function AuctionProfitCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
          <Calculator className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 sm:text-[40px]">
          아파트 경매 수익률 계산기
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[16px] leading-relaxed text-zinc-500">
          입찰가와 아파트 정보를 입력하면 취득비용·시세·수익률을 자동으로 분석합니다.
          로그인 없이 무료로 사용할 수 있습니다.
        </p>
      </div>

      {/* 기능 소개 */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
              <Icon className="h-4.5 w-4.5 text-zinc-600" />
            </div>
            <p className="text-[14px] font-semibold text-zinc-800">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* 계산기 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-[18px] font-bold text-zinc-900">계산기</h2>
        <AuctionInputForm />
      </div>

      {/* 로그인 CTA */}
      <div className="mt-8 rounded-2xl bg-zinc-50 border border-zinc-200 p-6 text-center">
        <p className="text-[14px] font-semibold text-zinc-700">더 많은 기능이 필요하신가요?</p>
        <p className="mt-1 text-[13px] text-zinc-500">
          로그인하면 분석 기록 저장, 임장 메모, 출구전략 비교 기능을 무료로 사용할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            무료 시작하기
          </Link>
          <Link
            href="/dashboard/calculator"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            대시보드 계산기
          </Link>
        </div>
      </div>
    </div>
  );
}
