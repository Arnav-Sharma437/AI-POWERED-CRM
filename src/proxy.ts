import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API exceptions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const token = request.cookies.get("token")?.value;
  const hasSession = token ? await verifyJWT(token) : null;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Redirect logged in users away from login page only
  if (pathname === "/login") {
    if (hasSession) {
      const dashUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
