import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

// Uses the `pg` driver, which requires the Node.js runtime.
export const runtime = "nodejs";

interface ContactRow {
  id: number;
  first_name: string;
  last_name: string;
}

export async function POST(request: NextRequest) {
  let body: { firstName?: unknown; lastName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";

  if (!firstName || !lastName) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const result = await query<ContactRow>(
    `SELECT id, first_name, last_name
       FROM contacts
      WHERE LOWER(TRIM(first_name)) = LOWER($1)
        AND LOWER(TRIM(last_name)) = LOWER($2)
      LIMIT 1`,
    [firstName, lastName]
  );

  const contact = result.rows[0];
  if (!contact) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // Record the sign-in so the admin can see who has logged in.
  await query(`UPDATE contacts SET last_signed_in_at = now() WHERE id = $1`, [
    contact.id,
  ]);

  const token = await createSessionToken({
    contactId: contact.id,
    firstName: contact.first_name,
    lastName: contact.last_name,
  });

  const response = NextResponse.json({
    ok: true,
    guest: { firstName: contact.first_name, lastName: contact.last_name },
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
