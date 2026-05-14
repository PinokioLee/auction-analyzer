"use client";

import { useState } from "react";
import { calcCapitalGainsTax } from "@/lib/calculator/exit-strategy";

function fmt(manwon: number) {
  if (Math.abs(manwon) >= 10_000)
    return `${(manwon / 10_000).toFixed(2)}억원`;
  return `${manwon.toLocaleString()}만원`;
}

interface Result {
  gain: number;
  longTermDeduction: number;
  afterLongTerm: number;
  basicDeduction: number;
  taxBase: number;
  tax: number;
  holdLabel: string;
  rateLabel: string;
}

function calcDetail(gain: number, holdMonths: number): Result {
  const holdYears = holdMonths / 12;
  let longTermDeduction = 0;
  let afterLongTerm = gain;
  let basicDeduction = 0;
  let taxBase = gain;
  let rateLabel = "";

  if (holdMonths < 12) {
    rateLabel = "단기세율 70%";
    taxBase = gain;
  } else if (holdMonths < 24) {
    rateLabel = "단기세율 60%";
    taxBase = gain;
  } else {
    longTermDeduction = Math.min(holdYears * 0.02, 0.30);
    afterLongTerm = Math.round(gain * (1 - longTermDeduction));
    basicDeduction = Math.min(250, afterLongTerm);
    taxBase = Math.max(0, afterLongTerm - basicDeduction);
    rateLabel = "누진세율 (6~45%)";
  }

  const holdLabel =
    holdMonths < 12  ? `${holdMonths}개월 (1년 미만)` :
    holdMonths < 24  ? `${holdMonths}개월 (2년 미만)` :
    `${holdMonths}개월 (${Math.floor(holdMonths / 12)}년 ${holdMonths % 12 ? holdMonths % 12 + "개월" : ""})`.trim();

  const tax = calcCapitalGainsTax(gain, holdMonths);

  return { gain, longTermDeduction, afterLongTerm, basicDeduction, taxBase, tax, holdLabel, rateLabel };
}

export function TaxSimulator() {
  const [buyPrice,    setBuyPrice]    = useState("");
  const [sellPrice,   setSellPrice]   = useState("");
  const [holdMonths,  setHoldMonths]  = useState("");
  const [result,      setResult]      = useState<Result | null>(null);

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400";
  const labelCls = "mb-1.5 block text-[12px] font-medium text-zinc-500";

  function handleCalc() {
    const buy   = Number(buyPrice);
    const sell  = Number(sellPrice);
    const months = Number(holdMonths);
    if (!buy || !sell || !months || buy <= 0 || sell <= 0 || months <= 0) return;
    const gain = sell - buy;
    if (gain <= 0) {
      setResult({ gain, longTermDeduction: 0, afterLongTerm: gain, basicDeduction: 0, taxBase: 0, tax: 0, holdLabel: `${months}개월`, rateLabel: "손실" });
      return;
    }
    setResult(calcDetail(gain, months));
  }

  return (
    <div className="space-y-6">
      {/* 입력 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-5 text-[14px] font-semibold text-zinc-700">기본 정보 입력</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>취득가 (만원)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="예) 50000"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>매도 예정가 (만원)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="예) 65000"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>보유 기간 (개월)</label>
            <input
              type="number"
              min="1"
              className={inputCls}
              placeholder="예) 24"
              value={holdMonths}
              onChange={(e) => setHoldMonths(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCalc}
              className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              계산하기
            </button>
          </div>
        </div>
      </section>

      {/* 결과 */}
      {result && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-5 text-[14px] font-semibold text-zinc-700">계산 결과</h2>

          {result.gain <= 0 ? (
            <p className="text-sm text-zinc-500">
              양도차익이 없습니다 ({fmt(result.gain)}). 양도소득세가 부과되지 않습니다.
            </p>
          ) : (
            <div className="space-y-2">
              <Row label="양도차익"             value={fmt(result.gain)}              />
              <Row label={`보유기간`}            value={result.holdLabel}              note={result.rateLabel} />

              {result.longTermDeduction > 0 && (
                <>
                  <Row
                    label="장기보유특별공제"
                    value={`-${fmt(Math.round(result.gain * result.longTermDeduction))}`}
                    note={`연 2%, 최대 30% → ${Math.round(result.longTermDeduction * 100)}%`}
                    minus
                  />
                  <Row label="기본공제"         value={`-${fmt(result.basicDeduction)}`} minus />
                  <Row label="과세표준"         value={fmt(result.taxBase)}            bold />
                </>
              )}

              <div className="my-2 border-t border-zinc-100" />

              <Row
                label="양도소득세 + 지방소득세"
                value={fmt(result.tax)}
                bold
                highlight
              />
              <Row
                label="세후 실수익"
                value={fmt(result.gain - result.tax)}
                bold
                highlight={result.gain - result.tax > 0}
              />
            </div>
          )}

          <p className="mt-5 text-[11px] text-zinc-400">
            * 개인 1주택 기준 참고용 시뮬레이션 — 실제 세액과 다를 수 있습니다.
          </p>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  note,
  bold,
  highlight,
  minus,
}: {
  label: string;
  value: string;
  note?: string;
  bold?: boolean;
  highlight?: boolean;
  minus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-zinc-50">
      <span className={`text-[13px] ${bold ? "font-semibold text-zinc-800" : "text-zinc-500"}`}>
        {label}
        {note && <span className="ml-1.5 text-[11px] text-zinc-400">{note}</span>}
      </span>
      <span
        className={`text-[13px] font-semibold ${
          highlight
            ? "text-emerald-600"
            : minus
            ? "text-red-500"
            : bold
            ? "text-zinc-800"
            : "text-zinc-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
