/**
 * MOLIT 백필 스크립트 (1회성 초기 데이터 수집)
 * 실행: npx tsx scripts/backfill.ts
 *
 * - backfill_progress 테이블에서 미완료 작업을 이어서 실행
 * - 일 최대 DAILY_LIMIT 건 처리 후 중단 (다음 날 GitHub Actions가 재실행)
 */

import { config } from "dotenv";
// .env.local 로드 (로컬 실행 시)
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { fetchMolit, normalizeItem } from "./molit-client";
import type { NormalizedItem } from "./molit-client";

// 전국 시군구 코드 (region-codes.json 재사용)
import regions from "../public/data/region-codes.json";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws } }  // Node.js < 22 WebSocket 호환
);

const DAILY_LIMIT = 9_500; // 일 10,000건 제한 안전 마진
const DELAY_MS = 210;      // 초당 ~4.7건

// ── 대상 YYYYMM 목록 (최근 240개월 = 20년) ──────────

function getTargetYmds(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 240; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(
      String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, "0")
    );
  }
  return result;
}

// ── 미완료 작업 조회 ─────────────────────────────

async function getPendingTasks() {
  const ymds = getTargetYmds();
  const tasks: { lawd_cd: string; deal_ymd: string }[] = [];

  for (const region of regions) {
    for (const ymd of ymds) {
      tasks.push({ lawd_cd: region.code, deal_ymd: ymd });
    }
  }

  const { data: done } = await supabase
    .from("backfill_progress")
    .select("lawd_cd, deal_ymd")
    .eq("status", "success");

  const doneSet = new Set(
    (done ?? []).map((d) => `${d.lawd_cd}_${d.deal_ymd}`)
  );
  return tasks.filter((t) => !doneSet.has(`${t.lawd_cd}_${t.deal_ymd}`));
}

// ── 단일 작업 처리 ───────────────────────────────

async function processTask(task: {
  lawd_cd: string;
  deal_ymd: string;
}): Promise<{ success: boolean; count: number }> {
  try {
    const items = await fetchMolit(task.lawd_cd, task.deal_ymd);
    const normalized: NormalizedItem[] = items
      .map((i) => normalizeItem(i, task.lawd_cd, task.deal_ymd))
      .filter((n) => n.apt_name && n.deal_amount > 0);

    if (normalized.length > 0) {
      const { error } = await supabase.from("apartment_trade").upsert(
        normalized,
        {
          onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deal_amount",
          ignoreDuplicates: true,
        }
      );
      if (error) throw new Error(error.message);
    }

    await supabase.from("backfill_progress").upsert(
      {
        lawd_cd: task.lawd_cd,
        deal_ymd: task.deal_ymd,
        status: "success",
        row_count: normalized.length,
        fetched_at: new Date().toISOString(),
        error_message: null,
      },
      { onConflict: "lawd_cd,deal_ymd" }
    );

    return { success: true, count: normalized.length };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("backfill_progress").upsert(
      {
        lawd_cd: task.lawd_cd,
        deal_ymd: task.deal_ymd,
        status: "failed",
        row_count: 0,
        fetched_at: new Date().toISOString(),
        error_message: msg,
      },
      { onConflict: "lawd_cd,deal_ymd" }
    );
    return { success: false, count: 0 };
  }
}

// ── 메인 ─────────────────────────────────────────

async function main() {
  // 환경변수 체크
  const missingVars = ["MOLIT_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    .filter((k) => !process.env[k]);
  if (missingVars.length > 0) {
    throw new Error(`환경변수 누락: ${missingVars.join(", ")}`);
  }
  console.log("[backfill] 환경변수 확인 완료");

  // Supabase 연결 체크
  const { error: pingError } = await supabase
    .from("backfill_progress")
    .select("lawd_cd")
    .limit(1);
  if (pingError) {
    throw new Error(`Supabase 연결 실패: ${pingError.message} (code: ${pingError.code})`);
  }
  console.log("[backfill] Supabase 연결 확인 완료");

  const startTime = Date.now();
  const tasks = await getPendingTasks();
  console.log(`[backfill] 총 대기 작업: ${tasks.length}개`);

  const limit = Math.min(tasks.length, DAILY_LIMIT);
  let totalRows = 0;
  let failed = 0;

  for (let i = 0; i < limit; i++) {
    const result = await processTask(tasks[i]);
    if (result.success) {
      totalRows += result.count;
    } else {
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(
        `[${i + 1}/${limit}] 누적 행: ${totalRows}, 실패: ${failed}, 경과: ${elapsed}s`
      );
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(
    `[backfill] 완료. 처리: ${limit}/${tasks.length}, 행: ${totalRows}, 실패: ${failed}, 소요: ${elapsed}s`
  );

  const remaining = tasks.length - limit;
  if (remaining > 0) {
    console.log(`[backfill] 남은 작업 ${remaining}개 → 내일 계속`);
  }
}

main().catch((e) => {
  console.error("[backfill] 치명적 오류:", e);
  process.exit(1);
});
