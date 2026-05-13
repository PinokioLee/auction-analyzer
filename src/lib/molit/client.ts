/**
 * 국토교통부 아파트 실거래가 API 클라이언트
 * 문서: https://www.data.go.kr/data/15057511/openapi.do
 * ⚠️ HTTP 엔드포인트 — 반드시 서버사이드(API Route)에서만 호출할 것
 */

import type { AptTransaction, FloorPriceAnalysis } from "@/types/auction";

const BASE_URL =
  "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

// ── 국토부 API 원시 응답 타입 ──────────────────────

interface RawItem {
  aptNm: string;
  excluUseAr: string;
  floor: string;
  dealAmount: string; // "55,000" 형태 — 쉼표 포함
  dealYear: string;
  dealMonth: string;
  buildYear?: string;
  umdNm?: string;
}

interface ApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      items: { item: RawItem | RawItem[] } | "" | null;
    };
  };
}

// ── 내부 유틸 ──────────────────────────────────────

function toManwon(dealAmountStr: string): number {
  return parseInt(dealAmountStr.replace(/,/g, ""), 10);
}

function normalizeItems(raw: ApiResponse["response"]["body"]["items"]): RawItem[] {
  if (!raw || typeof raw === "string") return [];
  const item = raw.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

// ── 단일 월 조회 ───────────────────────────────────

async function fetchMonthlyTransactions(
  regionCode: string,
  dealYmd: string // YYYYMM
): Promise<AptTransaction[]> {
  const serviceKey = process.env.MOLIT_API_KEY;
  if (!serviceKey) throw new Error("MOLIT_API_KEY 환경변수가 설정되지 않았습니다.");

  const params = new URLSearchParams({
    serviceKey,
    LAWD_CD: regionCode,
    DEAL_YMD: dealYmd,
    numOfRows: "1000",
    pageNo: "1",
    _type: "json",
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`국토부 API 오류: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  // 정상 코드: "00" (구 API) 또는 "000" (신 API)
  if (resultCode !== "00" && resultCode !== "000") {
    throw new Error(`국토부 API 에러코드 ${resultCode}: ${resultMsg}`);
  }

  return normalizeItems(data.response.body.items).map((item) => ({
    aptName: item.aptNm.trim(),
    area: parseFloat(item.excluUseAr),
    floor: parseInt(item.floor, 10),
    dealAmount: toManwon(item.dealAmount),
    dealYear: item.dealYear.trim(),
    dealMonth: item.dealMonth.trim().padStart(2, "0"),
  }));
}

// ── 최근 N개월 조회 + 필터 ────────────────────────

export async function fetchRecentTransactions(
  aptName: string,
  area: number,
  regionCode: string,
  months = 6
): Promise<AptTransaction[]> {
  const results: AptTransaction[] = [];

  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym =
      String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, "0");

    try {
      const items = await fetchMonthlyTransactions(regionCode, ym);
      const filtered = items.filter(
        (t) =>
          t.aptName.includes(aptName) &&
          Math.abs(t.area - area) <= 3
      );
      results.push(...filtered);
    } catch {
      // 특정 월 실패 시 해당 월 스킵
    }
  }

  return results;
}

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
