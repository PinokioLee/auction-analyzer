/**
 * 대전광역시 데이터 수집 스크립트 (개발용 초기 시드)
 *
 * 수집 순서:
 *   1. 단지 목록  (AptListService3)        → apartment_master
 *   2. 단지 기본정보 (AptBasisInfoServiceV4) → apartment_master 업데이트
 *   3. 매매 실거래가 (RTMSDataSvcAptTradeDev) → apt_transactions
 *   4. 전월세 실거래가 (RTMSDataSvcAptRent)   → apartment_rent
 *
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/seed-daejeon.ts
 * 옵션:
 *   --months N   수집 개월수 (기본 36)
 *   --skip-basis 단지 기본정보 수집 건너뜀 (단지 수가 많아 느릴 때)
 *   --only trade|rent|complex  특정 단계만 실행
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { fetchMolit, normalizeItem }     from "./molit-client";
import { fetchComplexList, fetchComplexBasis } from "./molit-complex-client";
import { fetchRent }                     from "./molit-rent-client";

// ── 대전 5개 구 ───────────────────────────────────────────────
const DAEJEON = [
  { code: "30110", name: "동구" },
  { code: "30140", name: "중구" },
  { code: "30170", name: "서구" },
  { code: "30200", name: "유성구" },
  { code: "30230", name: "대덕구" },
];

const DELAY_MS = 220; // 초당 ~4.5건 (일 10,000건 제한 여유)

// ── CLI 파싱 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const monthsIdx = args.indexOf("--months");
const months    = monthsIdx !== -1 ? parseInt(args[monthsIdx + 1], 10) : 36;
const skipBasis = args.includes("--skip-basis");
const onlyIdx   = args.indexOf("--only");
const onlyStep  = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

// ── Supabase ──────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws } }
);

// ── 대상 월 목록 ──────────────────────────────────────────────
function getYmds(n: number): string[] {
  const list: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, "0"));
  }
  return list;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    return o["message"] ? String(o["message"]) : JSON.stringify(e);
  }
  return String(e);
}

// ── STEP 1: 단지 목록 수집 ────────────────────────────────────
async function collectComplexList() {
  console.log("\n[1/4] 단지 목록 수집 시작");
  let total = 0;

  for (const dist of DAEJEON) {
    process.stdout.write(`  ${dist.name}(${dist.code}) ... `);
    try {
      const list = await fetchComplexList(dist.code);
      if (list.length === 0) {
        console.log("0건 (응답 없음)");
        continue;
      }

      const rows = list.map((c) => ({
        lawd_cd:   dist.code,
        apt_name:  c.kaptName.trim(),
        kapt_code: c.kaptCode,
        bjd_code:  c.bjdCode ?? null,
        dong_name: c.as3 ?? null,
        addr:      [c.as1, c.as2, c.as3, c.as4].filter(Boolean).join(" ") || null,
      }));

      const { error } = await supabase
        .from("apartment_master")
        .upsert(rows, { onConflict: "lawd_cd,apt_name", ignoreDuplicates: false });

      if (error) throw new Error(error.message);
      console.log(`${list.length}건`);
      total += list.length;
    } catch (e) {
      console.log(`오류: ${errMsg(e)}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`  → 총 ${total}건 upsert 완료`);
}

// ── STEP 2: 단지 기본정보 수집 ────────────────────────────────
async function collectComplexBasis() {
  console.log("\n[2/4] 단지 기본정보 수집 시작");

  const { data: complexes, error } = await supabase
    .from("apartment_master")
    .select("id, kapt_code, apt_name")
    .in("lawd_cd", DAEJEON.map((d) => d.code))
    .not("kapt_code", "is", null);

  if (error || !complexes?.length) {
    console.log("  단지 목록이 없거나 오류 — STEP 1을 먼저 실행하세요");
    return;
  }

  console.log(`  대상 ${complexes.length}개 단지`);
  let updated = 0;
  let failed  = 0;

  for (let i = 0; i < complexes.length; i++) {
    const c = complexes[i];
    if (!c.kapt_code) continue;

    try {
      const info = await fetchComplexBasis(c.kapt_code);
      if (!info) { failed++; continue; }

      const usedate = info.kaptUsedate?.trim() || null;
      const totalHo = parseInt(info.kaptTotHo ?? "0", 10) || null;
      const totalDong = parseInt(info.kaptDong ?? info.kaptBcomplex ?? "0", 10) || null;

      await supabase
        .from("apartment_master")
        .update({
          total_household: totalHo,
          total_dong:      totalDong,
          use_date:        usedate,
          build_year:      usedate ? parseInt(usedate.slice(0, 4), 10) || null : null,
          road_addr:       info.kaptAddr?.trim() || null,
        })
        .eq("id", c.id);

      updated++;
    } catch {
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`  ${i + 1}/${complexes.length} (${updated}건 갱신)\r`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`  → ${updated}건 갱신, ${failed}건 실패`);
}

// ── STEP 3: 매매 실거래가 수집 ────────────────────────────────
async function collectTrade() {
  const ymds = getYmds(months);
  const total = DAEJEON.length * ymds.length;
  console.log(`\n[3/4] 매매 실거래가 수집 시작 (${months}개월 × ${DAEJEON.length}개 구 = ${total}건 API 호출)`);

  let done = 0;
  let rows = 0;

  for (const dist of DAEJEON) {
    for (const ymd of ymds) {
      try {
        const items = await fetchMolit(dist.code, ymd);
        const normalized = items
          .map((i) => normalizeItem(i, dist.code, ymd))
          .filter((n) => n.apt_name && n.deal_amount > 0);

        if (normalized.length > 0) {
          const { error } = await supabase
            .from("apt_transactions")
            .upsert(normalized, {
              onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deal_amount",
              ignoreDuplicates: true,
            });
          if (error) throw new Error(error.message);
          rows += normalized.length;
        }
      } catch (e) {
        process.stdout.write(`\n  오류 ${dist.code}/${ymd}: ${errMsg(e)}\n`);
      }

      done++;
      if (done % 10 === 0 || done === total) {
        process.stdout.write(`  ${done}/${total} 호출 완료, 누적 ${rows}건\r`);
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  → 매매 총 ${rows}건 저장`);
}

// ── STEP 4: 전월세 실거래가 수집 ──────────────────────────────
async function collectRent() {
  const ymds = getYmds(months);
  const total = DAEJEON.length * ymds.length;
  console.log(`\n[4/4] 전월세 실거래가 수집 시작 (${months}개월 × ${DAEJEON.length}개 구 = ${total}건 API 호출)`);

  let done = 0;
  let rows = 0;

  for (const dist of DAEJEON) {
    for (const ymd of ymds) {
      try {
        const items = await fetchRent(dist.code, ymd);

        if (items.length > 0) {
          const { error } = await supabase
            .from("apartment_rent")
            .upsert(
              items.map((r) => ({
                lawd_cd:        r.lawd_cd,
                apt_name:       r.apt_name,
                exclusive_area: r.exclusive_area,
                floor:          r.floor,
                rent_type:      r.rent_type,
                deposit:        r.deposit,
                monthly_rent:   r.monthly_rent,
                deal_date:      r.deal_date,
              })),
              {
                onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deposit,monthly_rent",
                ignoreDuplicates: true,
              }
            );
          if (error) throw new Error(error.message);
          rows += items.length;
        }
      } catch (e) {
        process.stdout.write(`\n  오류 ${dist.code}/${ymd}: ${errMsg(e)}\n`);
      }

      done++;
      if (done % 10 === 0 || done === total) {
        process.stdout.write(`  ${done}/${total} 호출 완료, 누적 ${rows}건\r`);
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  → 전월세 총 ${rows}건 저장`);
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  const missing = ["MOLIT_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    .filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`환경변수 누락: ${missing.join(", ")}`);

  console.log("=== 대전광역시 데이터 시드 ===");
  console.log(`수집 범위: 최근 ${months}개월`);
  if (onlyStep) console.log(`실행 단계: ${onlyStep} 만`);

  const startTime = Date.now();

  if (!onlyStep || onlyStep === "complex") {
    try {
      await collectComplexList();
      if (!skipBasis) await collectComplexBasis();
    } catch (e) {
      console.warn(`  단지목록/기본정보 수집 실패 (건너뜀): ${errMsg(e)}`);
    }
  }
  if (!onlyStep || onlyStep === "trade")   await collectTrade();
  if (!onlyStep || onlyStep === "rent")    await collectRent();

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n=== 완료 (소요: ${elapsed}s) ===`);
}

main().catch((e) => {
  console.error("\n치명적 오류:", e);
  process.exit(1);
});
