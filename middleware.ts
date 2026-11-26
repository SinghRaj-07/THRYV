import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuth = path === "/auth";
  const isAuthenticated = await verifySession(req.cookies.get("thryv_access")?.value);

  if (!isAuthenticated && !isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (isAuthenticated && isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
