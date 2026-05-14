/**
 * 샘플 데이터 수집 스크립트 (개발/테스트용)
 * 3개 지역 × 최근 12개월 데이터를 빠르게 수집합니다.
 *
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/collect/sample.ts
 *   또는: npm run collect:sample
 *
 * 용도
 *  - 로컬 개발환경에서 실거래가 데이터 빠르게 확보
 *  - 전체 백필 전 API 키/DB 연결 검증
 *  - CI 환경에서 최소 데이터셋 준비
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchMolit, normalizeItem } from "../molit-client";
import type { NormalizedItem } from "../molit-client";

// ── 샘플 3개 지역 ────────────────────────────────────
const SAMPLE_REGIONS = [
  { code: "11680", sido: "서울특별시", sigungu: "강남구" },
  { code: "11440", sido: "서울특별시", sigungu: "마포구" },
  { code: "41117", sido: "경기도",     sigungu: "수원시 영통구" },
];

const MONTHS = 12;   // 최근 12개월
const DELAY_MS = 250;

// ── 최근 N개월 YYYYMM 목록 ──────────────────────────
function getRecentYmds(months: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, "0"));
  }
  return result;
}

async function main() {
  // 환경변수 체크
  const missing = ["MOLIT_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    .filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`환경변수 누락: ${missing.join(", ")}`);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Supabase 연결 확인
  const { error: pingErr } = await supabase.from("apartment_trade").select("id").limit(1);
  if (pingErr) throw new Error(`Supabase 연결 실패: ${pingErr.message}`);

  const ymds = getRecentYmds(MONTHS);
  const startTime = Date.now();
  let totalRows = 0;
  let calls = 0;

  console.log(`[sample] 수집 시작: ${SAMPLE_REGIONS.map((r) => r.sigungu).join(", ")}`);
  console.log(`[sample] 대상 기간: ${ymds[ymds.length - 1]} ~ ${ymds[0]} (${MONTHS}개월)`);
  console.log(`[sample] 예상 API 호출: ${SAMPLE_REGIONS.length * ymds.length}건`);
  console.log("");

  for (const region of SAMPLE_REGIONS) {
    let regionRows = 0;
    process.stdout.write(`[${region.sigungu}] `);

    for (const ymd of ymds) {
      try {
        const items = await fetchMolit(region.code, ymd);
        const normalized: NormalizedItem[] = items
          .map((i) => normalizeItem(i, region.code, ymd))
          .filter((n) => n.apt_name && n.deal_amount > 0);

        if (normalized.length > 0) {
          const { error } = await supabase.from("apartment_trade").upsert(normalized, {
            onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deal_amount",
            ignoreDuplicates: true,
          });
          if (error) throw new Error(error.message);
          regionRows += normalized.length;
          process.stdout.write(".");
        } else {
          process.stdout.write("_");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        process.stdout.write(`E(${msg.slice(0, 20)})`);
      }

      calls++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    totalRows += regionRows;
    console.log(` ${regionRows}건`);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log("");
  console.log(`[sample] 완료 — API 호출: ${calls}, 저장: ${totalRows}건, 소요: ${elapsed}s`);
}

main().catch((e) => {
  console.error("[sample] 오류:", e);
  process.exit(1);
});
