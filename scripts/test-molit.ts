/**
 * MOLIT API 단건 테스트
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/test-molit.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchMolit, normalizeItem } from "./molit-client";

async function main() {
  const key = process.env.MOLIT_API_KEY;
  if (!key) {
    console.error("❌ MOLIT_API_KEY 환경변수 없음 (.env.local 확인)");
    process.exit(1);
  }
  console.log("✅ MOLIT_API_KEY 확인 완료");

  // 강남구(11680) 2026년 4월 — 거래량 많은 지역/월로 테스트
  const lawdCd = "11680";
  const dealYmd = "202604";

  console.log(`\n🔍 MOLIT API 테스트: 강남구(${lawdCd}) ${dealYmd}`);

  try {
    const items = await fetchMolit(lawdCd, dealYmd);
    console.log(`✅ 응답 받음: ${items.length}건`);

    if (items.length > 0) {
      const sample = normalizeItem(items[0], lawdCd, dealYmd);
      console.log("\n📋 샘플 데이터 (첫 번째 건):");
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log("ℹ️  해당 월 거래 없음 (정상 응답)");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`❌ 실패: ${msg}`);
    process.exit(1);
  }
}

main();
