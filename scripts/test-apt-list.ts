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

  // 오퍼레이션 이름 × 첫 번째 파라미터 조합
  for (const op of LIST_OPS) {
    const url = op ? `${LIST_BASE}/${op}` : LIST_BASE;
    const { status, preview } = await probe(url, { bjdCode: LAWD });
    const mark = status === 200 ? "✅" : status === 404 ? "  " : "⚠️";
    console.log(`${mark} [${status}] ${op || "(no-op)"} → ${preview.slice(0, 100)}`);
    if (status === 200) {
      console.log("\n  ★ 오퍼레이션 찾음:", op || "(서브경로 없음)");
      console.log("  URL:", url);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // 200이 없으면 파라미터 이름 변형 시도 (getAptList 기준)
  console.log("\n=== 파라미터 이름 변형 탐색 (getAptList 기준) ===\n");
  for (const params of PARAM_VARIANTS) {
    const url = `${LIST_BASE}/getAptList`;
    const { status, preview } = await probe(url, params as Record<string, string>);
    const mark = status === 200 ? "✅" : "  ";
    console.log(`${mark} [${status}] params=${JSON.stringify(params)} → ${preview.slice(0, 80)}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // AptBasisInfoServiceV4도 탐색
  console.log("\n=== AptBasisInfoServiceV4 탐색 ===\n");
  const BASIS_BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4";
  const BASIS_OPS  = ["", "getAptBasisInfo", "getAptBasisInfoService", "getAptBasisInfoV4", "getAptInfo"];
  for (const op of BASIS_OPS) {
    const url = op ? `${BASIS_BASE}/${op}` : BASIS_BASE;
    const { status, preview } = await probe(url, { kaptCode: "A10000000" });
    const mark = status === 200 ? "✅" : "  ";
    console.log(`${mark} [${status}] ${op || "(no-op)"} → ${preview.slice(0, 100)}`);
    await new Promise(r => setTimeout(r, 300));
  }
}

main().catch(console.error);
