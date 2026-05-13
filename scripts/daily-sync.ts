/**
 * MOLIT 일일 동기화 스크립트
 * 실행: npx tsx scripts/daily-sync.ts
 *
 * - 최근 3개월 데이터 갱신 (소급 신고 대비)
 * - 전국 ~250개 구 × 3개월 = ~750건 API 호출 → 약 30분
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchMolit, normalizeItem } from "./molit-client";
import type { NormalizedItem } from "./molit-client";
import regions from "../public/data/region-codes.json";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DELAY_MS = 210;

// ── 최근 N개월 YYYYMM 목록 ───────────────────────

function getRecentYmds(months = 3): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(
      String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, "0")
    );
  }
  return result;
}

// ── 단일 작업 처리 ───────────────────────────────

async function processTask(
  lawdCd: string,
  dealYmd: string
): Promise<{ success: boolean; count: number; region: string }> {
  try {
    const items = await fetchMolit(lawdCd, dealYmd);
    const normalized: NormalizedItem[] = items
      .map((i) => normalizeItem(i, lawdCd, dealYmd))
      .filter((n) => n.apt_name && n.deal_amount > 0);

    if (normalized.length > 0) {
      const { error } = await supabase.from("apt_transactions").upsert(
        normalized,
        {
          onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deal_amount",
          ignoreDuplicates: true,
        }
      );
      if (error) throw new Error(error.message);
    }

    return { success: true, count: normalized.length, region: lawdCd };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[sync] ${lawdCd}/${dealYmd} 실패: ${msg}`);
    return { success: false, count: 0, region: lawdCd };
  }
}

// ── 메인 ─────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const runDate = new Date().toISOString().slice(0, 10);
  const targetYmds = getRecentYmds(3);

  console.log(`[daily-sync] ${runDate} 시작, 대상 월: ${targetYmds.join(", ")}`);

  let totalCalls = 0;
  let totalRows = 0;
  const failedRegions: string[] = [];

  for (const ymd of targetYmds) {
    for (const region of regions) {
      const result = await processTask(region.code, ymd);
      totalCalls++;
      if (result.success) {
        totalRows += result.count;
      } else {
        failedRegions.push(`${region.code}/${ymd}`);
      }

      if (totalCalls % 100 === 0) {
        console.log(`[sync] ${totalCalls}건 처리, 누적 행: ${totalRows}`);
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  // 로그 저장
  await supabase.from("daily_sync_log").insert({
    run_date: runDate,
    target_ymds: targetYmds,
    total_calls: totalCalls,
    total_rows: totalRows,
    failed_regions: failedRegions.length > 0 ? failedRegions : null,
    duration_seconds: duration,
  });

  console.log(
    `[daily-sync] 완료. 호출: ${totalCalls}, 행: ${totalRows}, 실패: ${failedRegions.length}, 소요: ${duration}s`
  );
}

main().catch((e) => {
  console.error("[daily-sync] 치명적 오류:", e);
  process.exit(1);
});
