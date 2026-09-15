import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/about",
  "/contact",
  "/contacts",
  "/faq",
  "/terms",
  "/disclaimer",
  "/privacy",
  "/cookies",
  "/careers",
  "/learning-paths",
  "/practice-labs",
  "/resources",
  "/leaderboard",
  "/room",
  "/api",
  "/_next",
  "/admin"
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow visitors to land first on home page overview dashboard
  if (pathname === "/" || pathname === "/overview") {
    return NextResponse.next();
  }

  // Ignore static assets, images, icons, and API routes
  if (
    pathname.includes(".") ||
    PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  // Check for active session cookie
  const sessionCookie = request.cookies.get("bb_session")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    const fullPath = pathname + (search || "");
    loginUrl.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
