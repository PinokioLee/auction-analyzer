import type { AptTransaction, FloorPriceAnalysis } from "@/types/auction";

// ── 층별 시세 분석 ────────────────────────────────

export function analyzePriceByFloor(
  transactions: AptTransaction[],
  totalFloors: number,
  months = 6
): FloorPriceAnalysis {
  const lowFloorMax = Math.floor(totalFloors * 0.33);
  const midFloorMax = Math.floor(totalFloors * 0.66);

  const buckets = {
    low:  transactions.filter((t) => t.floor <= lowFloorMax),
    mid:  transactions.filter((t) => t.floor > lowFloorMax && t.floor <= midFloorMax),
    high: transactions.filter((t) => t.floor > midFloorMax),
  };

  const avg = (items: AptTransaction[]) =>
    items.length === 0
      ? 0
      : Math.round(items.reduce((s, t) => s + t.dealAmount, 0) / items.length);

  const minPrice = (items: AptTransaction[]) =>
    items.length === 0 ? 0 : Math.min(...items.map((t) => t.dealAmount));

  const maxPrice = (items: AptTransaction[]) =>
    items.length === 0 ? 0 : Math.max(...items.map((t) => t.dealAmount));

  // 기간 문자열 생성
  const now = new Date();
  const end = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const start = `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}`;

  return {
    // 거래 없는 tier는 0 반환 (fallback 없음)
    low:  avg(buckets.low),
    mid:  avg(buckets.mid),
    high: avg(buckets.high),
    lowMin:   buckets.low.length  > 0 ? minPrice(buckets.low)  : 0,
    lowMax:   buckets.low.length  > 0 ? maxPrice(buckets.low)  : 0,
    lowCount: buckets.low.length,
    midMin:   buckets.mid.length  > 0 ? minPrice(buckets.mid)  : 0,
    midMax:   buckets.mid.length  > 0 ? maxPrice(buckets.mid)  : 0,
    midCount: buckets.mid.length,
    highMin:  buckets.high.length > 0 ? minPrice(buckets.high) : 0,
    highMax:  buckets.high.length > 0 ? maxPrice(buckets.high) : 0,
    highCount: buckets.high.length,
    dataCount: transactions.length,
    period: `${start} ~ ${end}`,
  };
}
