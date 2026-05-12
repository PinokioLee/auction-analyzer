import { NextRequest, NextResponse } from "next/server";
import { searchComplexes } from "@/lib/naver/client";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim();

  if (!keyword || keyword.length < 2) {
    return NextResponse.json(
      { error: "검색어는 2자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const results = await searchComplexes(keyword);
    return NextResponse.json(results);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "검색 오류";
    console.error("[complex/search]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
