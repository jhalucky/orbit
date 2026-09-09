import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/register", "/onboarding", "/orbit-api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const session = request.cookies.get("orbit_session")?.value;

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)",
  ],
};
