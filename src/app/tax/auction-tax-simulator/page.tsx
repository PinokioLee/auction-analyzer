import type { Metadata } from "next";
import Link from "next/link";
import { TaxSimulator } from "@/components/tax/tax-simulator";
import { Receipt } from "lucide-react";

export const metadata: Metadata = {
  title: "아파트 양도소득세 계산기 | 경매 분석기",
  description:
    "아파트 매도 시 발생하는 양도소득세를 간편하게 계산합니다. 장기보유특별공제, 기본공제, 지방소득세를 포함한 참고용 시뮬레이션입니다.",
  keywords: ["양도소득세 계산기", "아파트 양도세", "장기보유특별공제", "부동산 세금 계산기"],
  openGraph: {
    title: "아파트 양도소득세 계산기",
    description: "장기보유특별공제·지방소득세 포함 양도세 참고용 시뮬레이터",
    type: "website",
  },
};

const NOTES = [
  "개인 1주택 기준이며 다주택자, 법인, 비거주자에게는 적용되지 않습니다.",
  "조정대상지역 내 다주택자는 중과세율(+10~30%p)이 적용됩니다.",
  "1세대 1주택 비과세(2년 보유·거주 요건 충족 시)는 반영되지 않습니다.",
  "실제 세액은 다른 소득과의 합산 여부에 따라 달라질 수 있습니다.",
];

export default function AuctionTaxSimulatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <Receipt className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 sm:text-[34px]">
          아파트 양도소득세 계산기
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-zinc-500">
          보유 기간별 세율, 장기보유특별공제, 지방소득세를 포함한 양도세를 간편하게 계산합니다.
        </p>
      </div>

      {/* 경고 배너 */}
      <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
        ⚠️ 이 계산기는 <strong>참고용 시뮬레이션</strong>입니다. 실제 세금은 보유 주택 수,
        조정지역 여부, 비과세 요건 등에 따라 크게 달라집니다. 정확한 세액은 세무사에게 문의하세요.
      </div>

      {/* 계산기 */}
      <TaxSimulator />

      {/* 세율 안내 */}
      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-[14px] font-semibold text-zinc-700">적용 세율 안내</h2>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-zinc-500">보유 1년 미만</span>
            <span className="font-semibold text-red-600">70% + 지방소득세 10%</span>
          </div>
          <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-zinc-500">보유 1~2년</span>
            <span className="font-semibold text-orange-600">60% + 지방소득세 10%</span>
          </div>
          <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-zinc-500">보유 2년 이상</span>
            <span className="font-semibold text-zinc-700">누진세율 6~45% (장특공제 적용)</span>
          </div>
          <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-zinc-500">장기보유특별공제</span>
            <span className="font-semibold text-zinc-700">연 2%, 최대 30%</span>
          </div>
          <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-zinc-500">기본공제</span>
            <span className="font-semibold text-zinc-700">250만원 (연 1회)</span>
          </div>
        </div>
      </section>

      {/* 주의사항 */}
      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-[14px] font-semibold text-zinc-700">주의사항</h2>
        <ul className="space-y-1.5">
          {NOTES.map((note, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-zinc-500">
              <span className="mt-0.5 shrink-0 text-zinc-300">•</span>
              {note}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-6 rounded-2xl bg-zinc-900 p-5 text-center text-white">
        <p className="text-[14px] font-semibold">경매 입찰 전 수익률도 계산해보세요</p>
        <p className="mt-1 text-[13px] text-zinc-400">취득비용부터 출구전략까지 한번에 분석</p>
        <Link
          href="/calculator/auction-profit"
          className="mt-3 inline-flex items-center rounded-xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
        >
          경매 수익률 계산기 →
        </Link>
      </div>
    </div>
  );
}
