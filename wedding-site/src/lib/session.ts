import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type RsvpSession,
} from "@/lib/auth";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminToken,
  type AdminSession,
} from "@/lib/admin";

// Reads and verifies the RSVP session from the cookie store. Works in server
// components and route handlers (anything with access to next/headers).
export async function getSession(): Promise<RsvpSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
