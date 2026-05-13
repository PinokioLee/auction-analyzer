/**
 * 국토교통부 아파트 매매 실거래 API 클라이언트 (공유 모듈)
 * - JSON 포맷 사용 (_type=json)
 * - 스크립트 및 Next.js API Route 양쪽에서 사용
 */

const ENDPOINT =
  "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

// ── 원시 응답 타입 ─────────────────────────────────

interface RawItem {
  aptNm: string;
  excluUseAr: string;
  floor: string;
  dealAmount: string;   // "55,000"
  dealYear: string;
  dealMonth: string;
  dealDay?: string;
  buildYear?: string;
  umdNm?: string;
  jibun?: string;
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

// ── MOLIT API 호출 ─────────────────────────────────

export async function fetchMolit(
  lawdCd: string,
  dealYmd: string
): Promise<RawItem[]> {
  const key = process.env.MOLIT_API_KEY;
  if (!key) throw new Error("MOLIT_API_KEY 환경변수 없음");

  const params = new URLSearchParams({
    serviceKey: key,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    numOfRows: "1000",
    pageNo: "1",
    _type: "json",
  });

  const res = await fetch(`${ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: ApiResponse = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  // 정상 코드: "00" (구 API) 또는 "000" (신 API)
  if (resultCode !== "00" && resultCode !== "000") {
    throw new Error(`MOLIT ${resultCode}: ${resultMsg}`);
  }

  const body = data.response.body;
  if (!body.items || typeof body.items !== "object") return [];
  const item = body.items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

// ── 정규화 ─────────────────────────────────────────

export interface NormalizedItem {
  lawd_cd: string;
  deal_ymd: string;
  apt_name: string;
  exclusive_area: number;
  deal_amount: number;   // 만원
  floor: number | null;
  build_year: number | null;
  dong: string;
  jibun: string;
  deal_date: string;     // YYYY-MM-DD
}

export function normalizeItem(
  item: RawItem,
  lawdCd: string,
  dealYmd: string
): NormalizedItem {
  const amount = parseInt(String(item.dealAmount).replace(/[^0-9]/g, ""), 10);
  const year = String(item.dealYear ?? "").trim();
  const month = String(item.dealMonth ?? "").trim().padStart(2, "0");
  const day = String(item.dealDay ?? "1").trim().padStart(2, "0");

  return {
    lawd_cd: lawdCd,
    deal_ymd: dealYmd,
    apt_name: String(item.aptNm ?? "").trim(),
    exclusive_area: parseFloat(String(item.excluUseAr ?? "0")),
    deal_amount: isNaN(amount) ? 0 : amount,
    floor: item.floor ? parseInt(String(item.floor), 10) || null : null,
    build_year: item.buildYear ? parseInt(String(item.buildYear), 10) || null : null,
    dong: String(item.umdNm ?? "").trim(),
    jibun: String(item.jibun ?? "").trim(),
    deal_date: year && month ? `${year}-${month}-${day}` : dealYmd.slice(0, 4) + "-" + dealYmd.slice(4, 6) + "-01",
  };
}
