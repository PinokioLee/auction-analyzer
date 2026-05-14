import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const lawdCd = req.nextUrl.searchParams.get("lawdCd");
  const aptName = req.nextUrl.searchParams.get("aptName");

  if (!lawdCd || !aptName) {
    return NextResponse.json({ error: "lawdCd, aptName 필수" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("apartment_trade")
    .select("exclusive_area")
    .eq("lawd_cd", lawdCd)
    .eq("apt_name", aptName);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 고유 평형 목록, 오름차순
  const unique = [...new Set((data ?? []).map((d) => Number(d.exclusive_area)))].sort(
    (a, b) => a - b
  );

  const result = unique.map((area) => {
    const pyeong = Math.round(area * 0.3025 * 10) / 10;
    const areaDisplay = Number.isInteger(area) ? `${area}` : area.toFixed(2);
    return {
      exclusive_area: area,
      pyeong,
      label: `전용 ${areaDisplay}㎡ (${pyeong}평)`,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
