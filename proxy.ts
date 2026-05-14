import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// 로그인 없이 접근 가능한 /dashboard 하위 경로
const PUBLIC_DASHBOARD = ["/dashboard/calculator", "/dashboard/report"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !user) {
    const isPublic = PUBLIC_DASHBOARD.some(
      (p) => path === p || path.startsWith(p + "/")
    );
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
