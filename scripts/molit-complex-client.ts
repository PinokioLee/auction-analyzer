/**
 * 국토교통부 공동주택 단지 API 클라이언트
 *
 * - AptListService3    : 단지 목록 (시군구코드 기준)
 * - AptBasisInfoServiceV4 : 단지 기본 정보 (단지코드 기준)
 */

const LIST_ENDPOINT =
  "https://apis.data.go.kr/1613000/AptListService3";
const BASIS_ENDPOINT =
  "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAptBasisInfo";

// ── 단지 목록 ──────────────────────────────────────────────────

export interface ComplexListItem {
  kaptCode: string;   // 단지코드
  kaptName: string;   // 단지명
  bjdCode:  string;   // 법정동코드 (10자리)
  as1:      string;   // 시도명
  as2:      string;   // 시군구명
  as3:      string;   // 읍면동명
  as4:      string;   // 단지번지
}

interface ListApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      pageNo: number;
      numOfRows: number;
      items: { item: ComplexListItem | ComplexListItem[] } | "" | null;
    };
  };
}

export async function fetchComplexList(lawdCd: string): Promise<ComplexListItem[]> {
  const key = process.env.MOLIT_API_KEY;
  if (!key) throw new Error("MOLIT_API_KEY 환경변수 없음");

  const all: ComplexListItem[] = [];
  let pageNo = 1;
  const numOfRows = 1000;

  while (true) {
    // 5자리 시군구코드 → 10자리 법정동코드 (뒤에 00000 패딩)
    const bjdCode10 = lawdCd.length === 5 ? lawdCd + "00000" : lawdCd;
    const params = new URLSearchParams({
      serviceKey: key,
      bjdCode:    bjdCode10,
      pageNo:     String(pageNo),
      numOfRows:  String(numOfRows),
      _type:      "json",
    });

    const res = await fetch(`${LIST_ENDPOINT}?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ListApiResponse = await res.json();
    const { resultCode, resultMsg } = data.response.header;
    if (resultCode !== "00" && resultCode !== "000") {
      throw new Error(`AptListService3 ${resultCode}: ${resultMsg}`);
    }

    const body = data.response.body;
    if (!body.items || typeof body.items !== "object") break;
    const item = body.items.item;
    if (!item) break;

    const rows = Array.isArray(item) ? item : [item];
    all.push(...rows);

    if (all.length >= body.totalCount) break;
    pageNo++;
  }

  return all;
}

// ── 단지 기본 정보 ─────────────────────────────────────────────

export interface ComplexBasisItem {
  kaptCode:     string;
  kaptName:     string;
  kaptAddr:     string;   // 주소
  kaptUsedate:  string;   // 사용승인일 (YYYYMMDD)
  kaptDong:     string;   // 동수
  kaptTotHo:    string;   // 총세대수
  kaptBcomplex: string;   // 총동수 (일부 API에서 다름)
  kaptdaCnt:    string;   // 총주차대수
  bjdCode:      string;
}

interface BasisApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      items: { item: ComplexBasisItem | ComplexBasisItem[] } | "" | null;
    };
  };
}

export async function fetchComplexBasis(kaptCode: string): Promise<ComplexBasisItem | null> {
  const key = process.env.MOLIT_API_KEY;
  if (!key) throw new Error("MOLIT_API_KEY 환경변수 없음");

  const params = new URLSearchParams({
    serviceKey: key,
    kaptCode,
    _type: "json",
  });

  const res = await fetch(`${BASIS_ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: BasisApiResponse = await res.json();
  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== "00" && resultCode !== "000") {
    throw new Error(`AptBasisInfoServiceV4 ${resultCode}: ${resultMsg}`);
  }

  const body = data.response.body;
  if (!body.items || typeof body.items !== "object") return null;
  const item = body.items.item;
  if (!item) return null;
  return Array.isArray(item) ? item[0] : item;
}
