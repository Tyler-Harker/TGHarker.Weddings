import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "rsvp_session";
// Sessions last well past the wedding so a guest only ever looks up their name once.
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export interface RsvpSession extends JWTPayload {
  contactId: number;
  firstName: string;
  lastName: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: {
  contactId: number;
  firstName: string;
  lastName: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<RsvpSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as RsvpSession;
  } catch {
    return null;
  }
}
