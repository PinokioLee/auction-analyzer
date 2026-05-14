/**
 * 국토교통부 아파트 전월세 실거래가 API 클라이언트
 * RTMSDataSvcAptRent/getRTMSDataSvcAptRent
 */

const ENDPOINT =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

// ── 원시 응답 타입 ─────────────────────────────────────────────

interface RawRentItem {
  aptNm:         string;
  excluUseAr:    string;
  floor:         string;
  leaseType?:    string;   // 전세 | 월세
  contractType?: string;   // 일부 버전에서 leaseType 대신 사용
  deposit:       string;   // 보증금 (만원, 콤마 포함)
  monthlyRent?:  string;   // 월세금 (만원)
  contractYear:  string;
  contractMonth: string;
  contractDay?:  string;
  umdNm?:        string;
  buildYear?:    string;
}

interface ApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      items: { item: RawRentItem | RawRentItem[] } | "" | null;
    };
  };
}

// ── 정규화 타입 ───────────────────────────────────────────────

export interface NormalizedRentItem {
  lawd_cd:        string;
  deal_ymd:       string;
  apt_name:       string;
  exclusive_area: number;
  floor:          number | null;
  rent_type:      "전세" | "월세";
  deposit:        number;
  monthly_rent:   number;
  deal_date:      string;   // YYYY-MM-DD
  build_year:     number | null;
  dong:           string;
}

// ── API 호출 ──────────────────────────────────────────────────

export async function fetchRent(
  lawdCd: string,
  dealYmd: string
): Promise<NormalizedRentItem[]> {
  const key = process.env.MOLIT_API_KEY;
  if (!key) throw new Error("MOLIT_API_KEY 환경변수 없음");

  const params = new URLSearchParams({
    serviceKey: key,
    LAWD_CD:    lawdCd,
    DEAL_YMD:   dealYmd,
    numOfRows:  "1000",
    pageNo:     "1",
    _type:      "json",
  });

  const res = await fetch(`${ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: ApiResponse = await res.json();
  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== "00" && resultCode !== "000") {
    throw new Error(`RTMSDataSvcAptRent ${resultCode}: ${resultMsg}`);
  }

  const body = data.response.body;
  if (!body.items || typeof body.items !== "object") return [];
  const item = body.items.item;
  if (!item) return [];

  const rows = Array.isArray(item) ? item : [item];
  return rows
    .map((r) => normalizeRent(r, lawdCd, dealYmd))
    .filter((r) => r.apt_name && r.deposit > 0);
}

function normalizeRent(
  item: RawRentItem,
  lawdCd: string,
  dealYmd: string
): NormalizedRentItem {
  const deposit = parseInt(String(item.deposit ?? "0").replace(/[^0-9]/g, ""), 10);
  const monthly = parseInt(String(item.monthlyRent ?? "0").replace(/[^0-9]/g, ""), 10);

  const rawType = String(item.leaseType ?? item.contractType ?? "").trim();
  const rentType: "전세" | "월세" = rawType === "월세" ? "월세" : "전세";

  const year  = String(item.contractYear  ?? "").trim();
  const month = String(item.contractMonth ?? "").trim().padStart(2, "0");
  const day   = String(item.contractDay   ?? "1").trim().padStart(2, "0");
  const dealDate = year && month
    ? `${year}-${month}-${day}`
    : `${dealYmd.slice(0, 4)}-${dealYmd.slice(4, 6)}-01`;

  return {
    lawd_cd:        lawdCd,
    deal_ymd:       dealYmd,
    apt_name:       String(item.aptNm ?? "").trim(),
    exclusive_area: parseFloat(String(item.excluUseAr ?? "0")),
    floor:          item.floor ? parseInt(String(item.floor), 10) || null : null,
    rent_type:      rentType,
    deposit:        isNaN(deposit) ? 0 : deposit,
    monthly_rent:   isNaN(monthly) ? 0 : monthly,
    deal_date:      dealDate,
    build_year:     item.buildYear ? parseInt(String(item.buildYear), 10) || null : null,
    dong:           String(item.umdNm ?? "").trim(),
  };
}
