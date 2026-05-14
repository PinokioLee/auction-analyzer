/**
 * AptListService3 오퍼레이션 이름 탐색
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/test-apt-list.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.MOLIT_API_KEY!;
const BASE = "https://apis.data.go.kr/1613000/AptListService3";
const LAWD = "30110";

const CANDIDATES = [
  "getAptList",
  "getAptListBjd",
  "getAptListByBjd",
  "getAptListByBjdCode",
  "getAptBasisInfoList",
  "getAptListSvc",
  "getAptInfo",
];

async function probe(op: string) {
  const params = new URLSearchParams({
    serviceKey: KEY,
    bjdCode:    LAWD,
    numOfRows:  "3",
    pageNo:     "1",
    _type:      "json",
  });
  const url = `${BASE}/${op}?${params}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    const text = await res.text();
    const preview = text.slice(0, 120).replace(/\n/g, " ");
    console.log(`  [${res.status}] ${op} → ${preview}`);
    return res.status;
  } catch (e) {
    console.log(`  [ERR] ${op} → ${e instanceof Error ? e.message : e}`);
    return 0;
  }
}

async function main() {
  if (!KEY) throw new Error("MOLIT_API_KEY 없음");
  console.log(`AptListService3 오퍼레이션 탐색 (bjdCode=${LAWD})\n`);
  for (const op of CANDIDATES) {
    await probe(op);
    await new Promise(r => setTimeout(r, 300));
  }
}

main();
