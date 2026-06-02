import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface AdminSession extends JWTPayload {
  role: "admin";
  email: string;
}

// Credentials live in env vars (defaults are fine for local/dev use).
export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "test@test.com",
    password: process.env.ADMIN_PASSWORD ?? "password",
  };
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return payload as AdminSession;
  } catch {
    return null;
  }
}
