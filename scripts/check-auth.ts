/**
 * Supabase 인증 역할 진단
 * 실행: npx tsx --tsconfig scripts/tsconfig.json scripts/check-auth.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("SUPABASE_URL:", url ? url.slice(0, 30) + "..." : "❌ 없음");
console.log("SUPABASE_SERVICE_ROLE_KEY:", key ? key.slice(0, 20) + "..." : "❌ 없음");

// JWT payload 디코딩 (서명 검증 없이)
if (key) {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString());
    console.log("\n🔑 JWT payload:");
    console.log("  role:", payload.role);   // "service_role" 이어야 함, "anon" 이면 문제
    console.log("  iss:", payload.iss);
    console.log("  exp:", payload.exp ? new Date(payload.exp * 1000).toISOString() : "없음");
  } catch {
    console.log("JWT 파싱 실패");
  }
}

// 실제 INSERT 테스트
const supabase = createClient(url, key, { realtime: { transport: ws } });

async function main() {
  console.log("\n📝 INSERT 테스트...");
  const { error } = await supabase.from("backfill_progress").upsert(
    {
      lawd_cd: "99999",
      deal_ymd: "000000",
      status: "auth_test",
      row_count: 0,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "lawd_cd,deal_ymd" }
  );

  if (error) {
    console.log("❌ INSERT 실패:", error.message, `(code: ${error.code})`);
    console.log("\n→ .env.local의 SUPABASE_SERVICE_ROLE_KEY를 Supabase 대시보드에서");
    console.log("  Project Settings > API > service_role 키로 교체하세요.");
  } else {
    console.log("✅ INSERT 성공 — 키 정상");
    // 테스트 행 삭제
    await supabase.from("backfill_progress").delete().eq("lawd_cd", "99999");
  }
}

main().catch(console.error);
