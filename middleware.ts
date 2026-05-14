import { NextResponse } from "next/server";

// Deprecated in Next.js 16 — real logic is in proxy.ts.
// This stub satisfies the build requirement while proxy.ts handles routing.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
