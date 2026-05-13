import Link from "next/link";
import { TrendingUp, Calculator, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "시세 분석",
    description:
      "국토부 실거래가 데이터를 기반으로 동일 단지·면적 최근 거래 내역을 분석합니다.",
  },
  {
    icon: Calculator,
    title: "취득비용 계산",
    description:
      "취득세, 법무사 비용, 명도비용, 대출이자 등 실제 부담할 총 취득비용을 자동 계산합니다.",
  },
  {
    icon: BarChart3,
    title: "수익률 분석",
    description:
      "저층·중층·고층 시세 대비 입찰가를 비교하여 예상 수익률을 한눈에 확인합니다.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">

      {/* Hero */}
      <section className="pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
        {/* 태그라인 */}
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
          Korea Real Estate Auction Tool
        </p>

        <h1 className="mx-auto max-w-xl text-[38px] font-bold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:text-[48px]">
          경매 물건,
          <br />
          <span className="text-zinc-400">숫자로 판단하세요</span>
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-[17px] leading-relaxed text-zinc-500">
          아파트 경매 시세 분석 · 취득비용 계산 ·<br className="hidden sm:block" />
          수익률 분석을 한 번에
        </p>

        <div className="mt-10">
          <Link
            href="/analyze"
            className="btn-lift inline-flex h-[52px] items-center gap-2 rounded-lg bg-zinc-900 px-7 text-[15px] font-semibold text-white shadow-md"
          >
            분석 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="pb-24 sm:pb-32">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors duration-200 group-hover:bg-zinc-200">
                <Icon className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
