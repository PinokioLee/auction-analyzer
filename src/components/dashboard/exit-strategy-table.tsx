import { calcExitStrategies, type ExitStrategyInput } from "@/lib/calculator/exit-strategy";
import { formatManwon } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  input: ExitStrategyInput;
  hasLoan: boolean;
}

export function ExitStrategyTable({ input, hasLoan }: Props) {
  const results = calcExitStrategies(input);

  const fmtROI = (v: number) => `${v >= 0 ? "+" : ""}${v}%`;
  const fmtProfit = (v: number) =>
    `${v >= 0 ? "+" : ""}${formatManwon(Math.abs(v))}${v < 0 ? " (손실)" : ""}`;

  return (
    <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-zinc-900">출구전략별 수익 비교</h2>
        <span className="text-[11px] text-zinc-400">현재 시세 기준 · 참고용</span>
      </div>
      <p className="mb-4 text-[11px] text-zinc-400">
        * 양도세는 1주택·일반개인 기준 간이 계산입니다. 실제 세금과 다를 수 있습니다.
      </p>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="pb-2.5 text-left text-[11px] font-medium text-zinc-400 w-24" />
              {results.map((r) => (
                <th
                  key={r.label}
                  className="pb-2.5 text-center text-[12px] font-semibold text-zinc-700"
                >
                  {r.label}
                  <div className="mt-0.5 text-[10px] font-normal text-zinc-400">
                    {r.holdMonths}개월 보유
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {/* 세전수익 */}
            <tr>
              <td className="py-2.5 text-[12px] text-zinc-500">세전수익</td>
              {results.map((r) => (
                <td
                  key={r.label}
                  className={cn(
                    "py-2.5 text-center tabular-nums text-[13px] font-medium",
                    r.grossProfit >= 0 ? "text-zinc-800" : "text-blue-600"
                  )}
                >
                  {fmtProfit(r.grossProfit)}
                </td>
              ))}
            </tr>
            {/* 예상 세금 */}
            <tr>
              <td className="py-2.5 text-[12px] text-zinc-500">예상 양도세</td>
              {results.map((r) => (
                <td
                  key={r.label}
                  className="py-2.5 text-center tabular-nums text-[13px] text-zinc-600"
                >
                  {r.taxAmount > 0 ? `−${formatManwon(r.taxAmount)}` : "—"}
                </td>
              ))}
            </tr>
            {/* 세후수익 */}
            <tr className="bg-zinc-50/60">
              <td className="py-2.5 text-[12px] font-semibold text-zinc-700">세후수익</td>
              {results.map((r) => (
                <td
                  key={r.label}
                  className={cn(
                    "py-2.5 text-center tabular-nums text-[14px] font-bold",
                    r.netProfit >= 0 ? "text-red-600" : "text-blue-600"
                  )}
                >
                  {fmtProfit(r.netProfit)}
                </td>
              ))}
            </tr>
            {/* 수익률 */}
            <tr className="bg-zinc-50/60">
              <td className="py-2.5 text-[12px] font-semibold text-zinc-700">
                {hasLoan ? "투자금대비" : "수익률"}
              </td>
              {results.map((r) => (
                <td
                  key={r.label}
                  className={cn(
                    "py-2.5 text-center tabular-nums text-[16px] font-bold",
                    r.netROI >= 0 ? "text-red-600" : "text-blue-600"
                  )}
                >
                  {fmtROI(r.netROI)}
                  {hasLoan && (
                    <div className={cn("text-[10px] font-normal", r.baseROI >= 0 ? "text-red-400" : "text-blue-400")}>
                      취득가 {fmtROI(r.baseROI)}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
