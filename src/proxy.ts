import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const ROLE_PREFIXES: Record<string, string> = {
  admin: "/admin",
  coordinator: "/coordinator",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");

  // Identify which workspace route this request is targeting
  let targetRole: string | null = null;
  if (pathname.startsWith("/admin")) targetRole = "admin";
  else if (pathname.startsWith("/coordinator")) targetRole = "coordinator";
  else if (pathname.startsWith("/teacher")) targetRole = "teacher";
  else if (pathname.startsWith("/student")) targetRole = "student";
  else if (pathname.startsWith("/parent")) targetRole = "parent";

  if (!targetRole && !isProfileRoute) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionToken);

  // Reject unauthenticated or tampered sessions immediately at the server boundary
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Dedicated /profile route is accessible by any authenticated portal role
  if (isProfileRoute) {
    return NextResponse.next();
  }

  const authorizedPrefix = ROLE_PREFIXES[session.role];
  if (authorizedPrefix && !pathname.startsWith(authorizedPrefix)) {
    const redirectUrl = new URL(authorizedPrefix, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/coordinator/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/profile/:path*",
    "/profile",
  ],
};
