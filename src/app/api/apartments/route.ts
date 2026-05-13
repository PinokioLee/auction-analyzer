import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const lawdCd = req.nextUrl.searchParams.get("lawdCd");
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!lawdCd) {
    return NextResponse.json({ error: "lawdCd 필수" }, { status: 400 });
  }

  const supabase = await createClient();

  const query = supabase
    .from("apt_transactions")
    .select("apt_name")
    .eq("lawd_cd", lawdCd);

  // 검색어가 있으면 ilike 필터
  const filtered = q.trim()
    ? query.ilike("apt_name", `%${q.trim()}%`)
    : query;

  const { data, error } = await filtered.limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 아파트명별 거래 건수 집계 → 많은 순
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.apt_name, (counts.get(row.apt_name) ?? 0) + 1);
  }

  const result = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
