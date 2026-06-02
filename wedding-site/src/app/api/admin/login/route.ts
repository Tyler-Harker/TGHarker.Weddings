import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminCredentials,
  createAdminToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const creds = getAdminCredentials();
  const ok =
    email.toLowerCase() === creds.email.toLowerCase() &&
    password === creds.password;

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 }
    );
  }

  const token = await createAdminToken(creds.email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
