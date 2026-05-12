import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPyeongs } from "@/lib/naver/client";
import type { NaverPyeong } from "@/lib/naver/client";

const CACHE_TTL_DAYS = 7;

function isExpired(cachedAt: string | null): boolean {
  if (!cachedAt) return true;
  const diff = Date.now() - new Date(cachedAt).getTime();
  return diff > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

interface Params {
  params: Promise<{ complexNo: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { complexNo } = await params;
  // 검색 단계에서 complexName을 쿼리로 넘길 수 있음 (캐시 저장용)
  const complexName =
    request.nextUrl.searchParams.get("complexName") ?? complexNo;

  const supabase = await createClient();

  // 1. 캐시 조회
  const { data: cached } = await supabase
    .from("complex_cache")
    .select("pyeongs, cached_at, complex_name")
    .eq("complex_no", complexNo)
    .single();

  if (cached && !isExpired(cached.cached_at)) {
    return NextResponse.json(cached.pyeongs);
  }

  // 2. 네이버 API 호출
  try {
    const pyeongs: NaverPyeong[] = await fetchPyeongs(complexNo);

    // 3. 캐시 upsert
    await supabase.from("complex_cache").upsert(
      {
        complex_no: complexNo,
        complex_name: cached?.complex_name ?? complexName,
        pyeongs: JSON.parse(JSON.stringify(pyeongs)),
        cached_at: new Date().toISOString(),
      },
      { onConflict: "complex_no", ignoreDuplicates: false }
    );

    return NextResponse.json(pyeongs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "네이버 API 오류";
    console.error("[complex/pyeongs]", complexNo, msg);

    // 네이버 차단 시: 만료된 캐시라도 반환
    if (cached) {
      return NextResponse.json(cached.pyeongs);
    }

    return NextResponse.json(
      { error: "NAVER_BLOCKED", allowManualInput: true, message: msg },
      { status: 502 }
    );
  }
}
