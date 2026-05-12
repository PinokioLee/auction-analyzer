/**
 * 네이버 부동산 비공식 API 클라이언트
 * ⚠️ 응답 스키마 변경 가능성 있음 — 에러 핸들링 필수
 * ⚠️ 서버사이드(API Route)에서만 호출할 것
 */

const BASE = "https://new.land.naver.com/api";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://new.land.naver.com/",
  Accept: "application/json, text/plain, */*",
};

// ── 공통 타입 ──────────────────────────────────────

export interface NaverComplex {
  complexNo: string;
  complexName: string;
  address: string;
}

export interface NaverPyeong {
  pyeongNo: string;
  pyeongName: string;        // "84A" 등 내부 코드
  supplyArea: number;        // 공급면적 ㎡
  exclusiveArea: number;     // 전용면적 ㎡
  displayLabel: string;      // UI 표시용
}

export interface NaverTransaction {
  floor: number;
  dealAmount: number;        // 만원
  dealYear: string;
  dealMonth: string;
}

// ── 단지 검색 ─────────────────────────────────────

export async function searchComplexes(keyword: string): Promise<NaverComplex[]> {
  const url = `${BASE}/search?query=${encodeURIComponent(keyword)}&type=complex&searchType=text`;
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });

  if (!res.ok) throw new Error(`네이버 검색 오류: ${res.status}`);

  const data = await res.json();

  // 응답 구조: { complexes: [...] } 또는 { result: { complexList: [...] } }
  const list: unknown[] =
    data?.complexes ??
    data?.result?.complexList ??
    data?.body?.complexs ??
    [];

  return list
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      complexNo: String(item.complexNo ?? item.hscpNo ?? ""),
      complexName: String(item.complexName ?? item.hscpNm ?? ""),
      address: String(item.address ?? item.cortarAddress ?? item.roadAddressName ?? ""),
    }))
    .filter((c) => c.complexNo && c.complexName);
}

// ── 평형 목록 ─────────────────────────────────────

export async function fetchPyeongs(complexNo: string): Promise<NaverPyeong[]> {
  const url = `${BASE}/complexes/${complexNo}`;
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });

  if (!res.ok) throw new Error(`네이버 단지 조회 오류: ${res.status}`);

  const data = await res.json();

  const rawList: unknown[] =
    data?.complexPyeongDetailList ??
    data?.result?.complexPyeongDetailList ??
    data?.body?.complexPyeongDetailList ??
    [];

  return rawList
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const excl = parseFloat(String(item.exclusiveArea ?? item.exclusiveSpace ?? 0));
      const supply = parseFloat(String(item.supplyArea ?? item.supplySpace ?? 0));
      const pyeongNo = String(item.pyeongNo ?? item.areaNo ?? "");
      const pyeongName = String(item.pyeongName ?? item.pyeongTypeName ?? `${Math.round(supply)}㎡`);
      const pyeong = Math.round(excl * 0.3025);

      return {
        pyeongNo,
        pyeongName,
        supplyArea: supply,
        exclusiveArea: excl,
        displayLabel: `${Math.round(supply)}㎡ (전용 ${excl}㎡ / 약 ${pyeong}평)`,
      };
    })
    .filter((p) => p.pyeongNo);
}

// ── 실거래가 ───────────────────────────────────────

export async function fetchNaverTransactions(
  complexNo: string,
  areaNo: string,
): Promise<NaverTransaction[]> {
  const url =
    `${BASE}/complexes/${complexNo}/prices/real?tradeType=A1&areaNo=${areaNo}`;
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });

  if (!res.ok) throw new Error(`네이버 실거래가 오류: ${res.status}`);

  const data = await res.json();

  const rawList: unknown[] =
    data?.realPriceList ??
    data?.result?.realPriceList ??
    data?.body?.realPriceList ??
    [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return rawList
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const year = String(item.dealYear ?? "");
      const month = String(item.dealMonth ?? "").padStart(2, "0");
      const amountStr = String(item.dealAmount ?? item.price ?? "0").replace(/,/g, "");
      return {
        floor: parseInt(String(item.floor ?? 0), 10),
        dealAmount: parseInt(amountStr, 10),
        dealYear: year,
        dealMonth: month,
      };
    })
    .filter((t) => {
      if (!t.dealYear || !t.dealMonth) return false;
      const dealDate = new Date(`${t.dealYear}-${t.dealMonth}-01`);
      return dealDate >= sixMonthsAgo && t.dealAmount > 0;
    });
}
