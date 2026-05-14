/**
 * AptListService3 실제 응답 확인
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/test-apt-list.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const KEY  = process.env.MOLIT_API_KEY!;

async function call(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ serviceKey: KEY, numOfRows: "3", pageNo: "1", _type: "json", ...params });
  const res = await fetch(`${url}?${qs}`, { signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  console.log(`\n[${res.status}] ${url}`);
  console.log("params:", JSON.stringify(params));
  console.log("response:", text.slice(0, 500));
  return res.status;
}

async function main() {
  if (!KEY) throw new Error("MOLIT_API_KEY 없음");

  const LIST_BASE = "https://apis.data.go.kr/1613000/AptListService3";

  // 시군구 코드 변형
  await call(`${LIST_BASE}/getSigunguAptList3`, { sigunguCode: "30110" });
  await call(`${LIST_BASE}/getSigunguAptList3`, { sigunguCode: "30" });
  await call(`${LIST_BASE}/getSigunguAptList3`, { sigunguCode: "3011000000" });

  // 시도 코드로 시도
  await call(`${LIST_BASE}/getSidoAptList3`,    { sidoCode: "30" });

  // 기본정보
  const BASIS_BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4";
  await call(`${BASIS_BASE}/getAphusBassInfoV4`, { kaptCode: "A10000000" });
}

main().catch(console.error);
