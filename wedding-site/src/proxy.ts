import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin area ---
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const admin = adminToken ? await verifyAdminToken(adminToken) : null;

    if (pathname === "/admin/login") {
      if (admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- Guest area ---
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // The dashboard is only for guests who have looked up their invitation.
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/rsvp";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Returning, authenticated guests skip the landing/RSVP pages and go
  // straight to their dashboard.
  if (pathname === "/" || pathname === "/rsvp") {
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/rsvp", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
