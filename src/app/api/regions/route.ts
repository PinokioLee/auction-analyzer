import { NextResponse } from "next/server";
import regions from "../../../../public/data/region-codes.json";

interface Region {
  code: string;
  sido: string;
  sigungu: string;
}

// 시도별로 그룹화
export async function GET() {
  const grouped: Record<string, { code: string; name: string }[]> = {};

  for (const r of regions as Region[]) {
    if (!grouped[r.sido]) grouped[r.sido] = [];
    grouped[r.sido].push({ code: r.code, name: r.sigungu });
  }

  return NextResponse.json(grouped, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
