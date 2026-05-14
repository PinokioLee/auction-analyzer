/**
 * AptListService3 / AptBasisInfoServiceV4 엔드포인트 탐색
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/test-apt-list.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const KEY  = process.env.MOLIT_API_KEY!;
const LAWD = "30110"; // 대전 동구

// ── 1. AptListService3 오퍼레이션 후보 ───────────────────────
const LIST_BASE = "https://apis.data.go.kr/1613000/AptListService3";
const LIST_OPS  = [
  "",                       // 서브경로 없이 직접 호출
  "getAptList",
  "getAptListBjd",
  "getAptListByBjd",
  "getAptListByBjdCode",
  "getAptListService3",
  "getAptListSvc3",
  "getAptBasisInfoList",
  "aptList",
];

// ── 2. 파라미터 이름 후보 ─────────────────────────────────────
const PARAM_VARIANTS = [
  { bjdCode: LAWD },
  { bjdCode: LAWD + "00000" },   // 10자리 패딩
  { bjdCode: "3011000000" },     // 10자리 법정동코드
  { sidoCode: "30" },            // 시도코드
  { sggCd: LAWD },
  { lawdCd: LAWD },
  { LAWD_CD: LAWD },
];

async function probe(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ serviceKey: KEY, numOfRows: "1", pageNo: "1", _type: "json", ...params });
  const fullUrl = `${url}?${qs}`;
  try {
    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(8_000) });
    const text = await res.text();
    const preview = text.slice(0, 150).replace(/[\n\r]/g, " ");
    return { status: res.status, preview };
  } catch (e) {
    return { status: 0, preview: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  if (!KEY) throw new Error("MOLIT_API_KEY 없음");

  console.log("=== AptListService3 엔드포인트 탐색 ===\n");

  // 베이스 URL(서브경로 없음)에서 파라미터 변형 탐색
  console.log("=== 베이스 URL 파라미터 변형 탐색 ===\n");
  const paramVariants: Array<{ label: string; params: Record<string, string> }> = [
    { label: "bjdCode=5자리",         params: { bjdCode: LAWD } },
    { label: "bjdCode=10자리(00000)", params: { bjdCode: LAWD + "00000" } },
    { label: "bjdCode=10자리(정확)",  params: { bjdCode: "3011000000" } },
    { label: "sidoCode=30",           params: { sidoCode: "30" } },
    { label: "sggCd=5자리",           params: { sggCd: LAWD } },
    { label: "lawdCd=5자리",          params: { lawdCd: LAWD } },
    { label: "LAWD_CD=5자리",         params: { LAWD_CD: LAWD } },
  ];

  for (const { label, params } of paramVariants) {
    const { status, preview } = await probe(LIST_BASE, params);
    const mark = status === 200 ? "✅" : status === 500 ? "⚠️" : "  ";
    console.log(`${mark} [${status}] ${label} → ${preview.slice(0, 100)}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // AptBasisInfoServiceV4 탐색
  console.log("\n=== AptBasisInfoServiceV4 탐색 ===\n");
  const BASIS_BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4";
  const basisVariants: Array<{ label: string; url: string; params: Record<string, string> }> = [
    { label: "(no-op)",           url: BASIS_BASE,                            params: { kaptCode: "A10000000" } },
    { label: "getAptBasisInfo",   url: `${BASIS_BASE}/getAptBasisInfo`,       params: { kaptCode: "A10000000" } },
    { label: "getAptBasisInfoV4", url: `${BASIS_BASE}/getAptBasisInfoV4`,     params: { kaptCode: "A10000000" } },
  ];
  for (const { label, url, params } of basisVariants) {
    const { status, preview } = await probe(url, params);
    const mark = status === 200 ? "✅" : status === 500 ? "⚠️" : "  ";
    console.log(`${mark} [${status}] ${label} → ${preview.slice(0, 100)}`);
    await new Promise(r => setTimeout(r, 300));
  }
}

main().catch(console.error);
