import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const lawdCd = req.nextUrl.searchParams.get("lawdCd");
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!lawdCd) {
    return NextResponse.json({ error: "lawdCd 필수" }, { status: 400 });
  }

  const supabase = await createClient();

  // DB 측에서 GROUP BY + COUNT → JS 3000행 그룹핑 제거
  const { data, error } = await supabase.rpc("search_apartments", {
    p_lawd_cd: lawdCd,
    p_query: q.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? []).map((row: { name: string; count: number }) => ({
    name: row.name,
    count: row.count,
  }));

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
