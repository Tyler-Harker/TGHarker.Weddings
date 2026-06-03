import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs";

// Add a guest to the invite list.
export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: {
    firstName?: unknown;
    lastName?: unknown;
    partyName?: unknown;
    email?: unknown;
    maxPartySize?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const partyName =
    typeof body.partyName === "string" && body.partyName.trim()
      ? body.partyName.trim()
      : null;
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim()
      : null;
  const maxPartySize =
    Number.isInteger(body.maxPartySize) && (body.maxPartySize as number) >= 1
      ? (body.maxPartySize as number)
      : 2;

  if (!firstName || !lastName) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  try {
    const result = await query<{ id: number }>(
      `INSERT INTO contacts (first_name, last_name, party_name, email, max_party_size)
            VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
      [firstName, lastName, partyName, email, maxPartySize]
    );
    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    // Unique violation on the (first, last) name pair.
    if (
      err &&
      typeof err === "object" &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    }
    throw err;
  }
}

// Remove a guest (cascades to their RSVP party + meal selections).
export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  await query(`DELETE FROM contacts WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}

// Update a guest's max party size.
export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: unknown; maxPartySize?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const id = Number(body.id);
  const maxPartySize = Number(body.maxPartySize);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }
  if (!Number.isInteger(maxPartySize) || maxPartySize < 1) {
    return NextResponse.json(
      { ok: false, error: "invalid_size" },
      { status: 400 }
    );
  }

  await query(`UPDATE contacts SET max_party_size = $1 WHERE id = $2`, [
    maxPartySize,
    id,
  ]);
  return NextResponse.json({ ok: true });
}
