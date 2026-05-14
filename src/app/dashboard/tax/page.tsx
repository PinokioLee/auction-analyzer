import type { Metadata } from "next";
import { TaxSimulator } from "@/components/tax/tax-simulator";

export const metadata: Metadata = {
  title: "양도세 시뮬레이터 | 경매 분석기",
};

export default function TaxPage() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">양도세 시뮬레이터</h1>
        <p className="mt-0.5 text-sm text-zinc-500">개인 1주택 기준 참고용 시뮬레이션</p>
      </div>

      <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
        ⚠️ 이 시뮬레이터는 <strong>참고용</strong>입니다. 실제 세금은 보유 주택 수, 조정지역 여부,
        비과세 요건 등에 따라 크게 달라질 수 있습니다. 정확한 세액은 세무사에게 문의하세요.
      </div>

      <TaxSimulator />
    </div>
  );
}
