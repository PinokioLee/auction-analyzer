/**
 * 단일 지역 수집 스크립트
 * 특정 지역 코드와 기간을 지정해서 수집합니다.
 *
 * 실행:
 *   npm run collect:region -- --code 11680 --months 6
 *   npm run collect:region -- --code 11440           # 기본 6개월
 *
 * 옵션:
 *   --code    <lawd_cd>  시군구 코드 (필수)
 *   --months  <N>        수집할 개월 수 (기본 6)
 *   --list               사용 가능한 지역 코드 출력
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchMolit, normalizeItem } from "../molit-client";
import type { NormalizedItem } from "../molit-client";
import regionCodes from "../../public/data/region-codes.json";

const DELAY_MS = 250;

// ── CLI 인자 파싱 ─────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let code = "";
  let months = 6;
  let list = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--code"   && args[i + 1]) { code   = args[++i]; }
    if (args[i] === "--months" && args[i + 1]) { months = parseInt(args[++i], 10) || 6; }
    if (args[i] === "--list")                   { list   = true; }
  }

  return { code, months, list };
}

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
  const { code, months, list } = parseArgs();

  // --list: 지역 코드 출력
  if (list) {
    console.log("사용 가능한 지역 코드:");
    for (const r of regionCodes) {
      console.log(`  ${r.code}  ${r.sido} ${r.sigungu}`);
    }
    return;
  }

  if (!code) {
    console.error("사용법: npm run collect:region -- --code <lawd_cd> [--months N]");
    console.error("        npm run collect:region -- --list");
    process.exit(1);
  }

  const region = regionCodes.find((r) => r.code === code);
  if (!region) {
    console.error(`알 수 없는 코드: ${code}`);
    console.error("npm run collect:region -- --list 로 목록을 확인하세요.");
    process.exit(1);
  }

  // 환경변수 체크
  const missing = ["MOLIT_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    .filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`환경변수 누락: ${missing.join(", ")}`);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ymds = getRecentYmds(months);
  const startTime = Date.now();
  let totalRows = 0;

  console.log(`[region] ${region.sido} ${region.sigungu} (${code})`);
  console.log(`[region] 기간: ${ymds[ymds.length - 1]} ~ ${ymds[0]} (${months}개월)`);
  process.stdout.write("[region] 수집 중: ");

  for (const ymd of ymds) {
    try {
      const items = await fetchMolit(code, ymd);
      const normalized: NormalizedItem[] = items
        .map((i) => normalizeItem(i, code, ymd))
        .filter((n) => n.apt_name && n.deal_amount > 0);

      if (normalized.length > 0) {
        const { error } = await supabase.from("apartment_trade").upsert(normalized, {
          onConflict: "lawd_cd,apt_name,exclusive_area,floor,deal_date,deal_amount",
          ignoreDuplicates: true,
        });
        if (error) throw new Error(error.message);
        totalRows += normalized.length;
        process.stdout.write(".");
      } else {
        process.stdout.write("_");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      process.stdout.write(`E`);
      console.error(`\n[region] ${ymd} 오류: ${msg}`);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(` ${totalRows}건`);
  console.log(`[region] 완료 — ${months}개월 / ${totalRows}건 저장 / ${elapsed}s`);
}

main().catch((e) => {
  console.error("[region] 오류:", e);
  process.exit(1);
});
