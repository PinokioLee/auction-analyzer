/**
 * 국토교통부 공동주택 단지 API 클라이언트
 *
 * - AptListService3/getSigunguAptList3    : 시군구 단지 목록
 * - AptBasisInfoServiceV4/getAphusBassInfoV4 : 단지 기본 정보
 */

const LIST_ENDPOINT =
  "https://apis.data.go.kr/1613000/AptListService3/getSigunguAptList3";
const BASIS_ENDPOINT =
  "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4";

// ── 단지 목록 ──────────────────────────────────────────────────

export interface ComplexListItem {
  kaptCode: string;
  kaptName: string;
  bjdCode:  string;
  as1:      string;   // 시도명
  as2:      string;   // 시군구명
  as3:      string;   // 읍면동명
  as4:      string | null;
}

interface ListApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      pageNo: number;
      numOfRows: number;
      items: ComplexListItem[] | null;  // 배열 직접 반환
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
    const params = new URLSearchParams({
      serviceKey:  key,
      sigunguCode: lawdCd,
      pageNo:      String(pageNo),
      numOfRows:   String(numOfRows),
      _type:       "json",
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

    const items = data.response.body.items;
    if (!items || !Array.isArray(items) || items.length === 0) break;

    all.push(...items);

    if (all.length >= data.response.body.totalCount) break;
    pageNo++;
  }

  return all;
}

// ── 단지 기본 정보 ─────────────────────────────────────────────

export interface ComplexBasisItem {
  kaptCode:     string | null;
  kaptName:     string | null;
  kaptAddr:     string | null;
  doroJuso:     string | null;   // 도로명주소
  kaptUsedate:  string | null;   // 사용승인일 (YYYYMMDD)
  kaptDongCnt:  string | null;   // 동수
  hoCnt:        string | null;   // 세대수
  kaptdaCnt:    string | null;   // 주차대수
  bjdCode:      string | null;
  kaptTopFloor: string | null;   // 최고층
}

interface BasisApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      item: ComplexBasisItem | null;  // 객체 직접 반환
    };
  };
}

export async function fetchComplexBasis(kaptCode: string): Promise<ComplexBasisItem | null> {
  const key = process.env.MOLIT_API_KEY;
  if (!key) throw new Error("MOLIT_API_KEY 환경변수 없음");

  const params = new URLSearchParams({
    serviceKey: key,
    kaptCode,
    _type:      "json",
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

  return data.response.body.item ?? null;
}
