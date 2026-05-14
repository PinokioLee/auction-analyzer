import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzePriceByFloor } from "@/lib/molit/client";
import regionCodes from "../../../../../public/data/region-codes.json";
import type { AptTransaction } from "@/types/auction";

interface Props {
  params: Promise<{ lawdCd: string; aptName: string }>;
}

function findRegion(lawdCd: string) {
  return regionCodes.find((r) => r.code === lawdCd) ?? null;
}

function fmt(manwon: number) {
  if (manwon <= 0) return "—";
  if (manwon >= 10_000) return `${(manwon / 10_000).toFixed(1)}억`;
  return `${manwon.toLocaleString()}만`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lawdCd, aptName: rawName } = await params;
  const aptName = decodeURIComponent(rawName);
  const region  = findRegion(lawdCd);
  const loc     = region ? `${region.sido} ${region.sigungu}` : lawdCd;

  return {
    title: `${aptName} 실거래가 | 경매 분석기`,
    description: `${loc} ${aptName} 아파트 최근 실거래가 조회 및 층별 시세 분석`,
    openGraph: {
      title: `${aptName} 실거래가 분석`,
      description: `${loc} ${aptName} 아파트 최근 실거래가 조회 및 층별 시세 분석`,
    },
  };
}

export default async function ApartmentPage({ params }: Props) {
  const { lawdCd, aptName: rawName } = await params;
  const aptName = decodeURIComponent(rawName);
  const region  = findRegion(lawdCd);

  const supabase = await createClient();

  // 최근 12개월 실거래 조회
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: txData } = await supabase
    .from("apartment_trade")
    .select("floor, deal_amount, deal_date, exclusive_area")
    .eq("lawd_cd", lawdCd)
    .eq("apt_name", aptName)
    .gte("deal_date", cutoffStr)
    .order("deal_date", { ascending: false })
    .limit(200);

  if (!txData || txData.length === 0) notFound();

  // 면적별 그룹
  const areaMap = new Map<number, typeof txData>();
  for (const tx of txData) {
    const key = tx.exclusive_area;
    if (!areaMap.has(key)) areaMap.set(key, []);
    areaMap.get(key)!.push(tx);
  }
  const areas = Array.from(areaMap.keys()).sort((a, b) => a - b);

  // 가장 거래 많은 면적으로 기본 층별 분석
  const primaryArea = [...areaMap.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const primaryTxs: AptTransaction[] = primaryArea[1].map((t) => ({
    aptName,
    area: t.exclusive_area,
    floor: t.floor ?? 1,
    dealAmount: t.deal_amount,
    dealYear: String(t.deal_date).slice(0, 4),
    dealMonth: String(t.deal_date).slice(5, 7),
  }));
  const floorAnalysis = analyzePriceByFloor(primaryTxs, 20, 12);

  const loc = region ? `${region.sido} ${region.sigungu}` : lawdCd;
  const calcUrl = `/dashboard/calculator?lawdCd=${lawdCd}&aptName=${encodeURIComponent(aptName)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <p className="mb-1 text-[13px] text-zinc-400">{loc}</p>
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900">{aptName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          최근 12개월 실거래 {txData.length}건 · 면적 {areas.length}종
        </p>
      </div>

      {/* 층별 시세 (주요 면적) */}
      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-[15px] font-semibold text-zinc-800">
          층별 평균 시세
          <span className="ml-2 text-[13px] font-normal text-zinc-400">
            전용 {primaryArea[0]}㎡ 기준
          </span>
        </h2>
        <p className="mb-5 text-[12px] text-zinc-400">{floorAnalysis.period}</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { tier: "저층",  count: floorAnalysis.lowCount,  avg: floorAnalysis.low,  min: floorAnalysis.lowMin,  max: floorAnalysis.lowMax  },
            { tier: "중층",  count: floorAnalysis.midCount,  avg: floorAnalysis.mid,  min: floorAnalysis.midMin,  max: floorAnalysis.midMax  },
            { tier: "고층",  count: floorAnalysis.highCount, avg: floorAnalysis.high, min: floorAnalysis.highMin, max: floorAnalysis.highMax },
          ].map(({ tier, count, avg, min, max }) => (
            <div key={tier} className="rounded-xl bg-zinc-50 p-4 text-center">
              <p className="text-[12px] font-medium text-zinc-400">{tier}</p>
              <p className="mt-1 text-[18px] font-bold text-zinc-900">{fmt(avg)}</p>
              {count > 0 && (
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {fmt(min)} ~ {fmt(max)}
                  <br />({count}건)
                </p>
              )}
              {count === 0 && <p className="mt-0.5 text-[11px] text-zinc-400">거래 없음</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 면적별 거래 수 */}
      {areas.length > 1 && (
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-zinc-800">면적별 거래 현황</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => {
              const count = areaMap.get(area)!.length;
              const txs   = areaMap.get(area)!;
              const avg   = Math.round(txs.reduce((s, t) => s + t.deal_amount, 0) / count);
              return (
                <div key={area} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-center">
                  <p className="text-[13px] font-semibold text-zinc-900">{area}㎡</p>
                  <p className="text-[12px] text-zinc-500">{fmt(avg)} · {count}건</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 최근 거래 내역 */}
      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-zinc-800">최근 거래 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400">
                <th className="pb-2 font-medium">거래일</th>
                <th className="pb-2 font-medium">면적</th>
                <th className="pb-2 font-medium">층</th>
                <th className="pb-2 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {txData.slice(0, 20).map((tx, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="py-2 text-zinc-500">{tx.deal_date}</td>
                  <td className="py-2 text-zinc-700">{tx.exclusive_area}㎡</td>
                  <td className="py-2 text-zinc-500">{tx.floor ?? "—"}층</td>
                  <td className="py-2 text-right font-semibold text-zinc-900">{fmt(tx.deal_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {txData.length > 20 && (
            <p className="mt-3 text-center text-[12px] text-zinc-400">
              최근 20건 표시 (전체 {txData.length}건)
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-zinc-900 p-6 text-center text-white">
        <p className="text-[15px] font-semibold">이 아파트로 입찰 수익률을 계산해보세요</p>
        <p className="mt-1 text-[13px] text-zinc-400">취득세·법무사비·대출이자까지 포함한 실수익 분석</p>
        <Link
          href={calcUrl}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
        >
          경매 수익률 계산하기
        </Link>
      </div>
    </div>
  );
}
