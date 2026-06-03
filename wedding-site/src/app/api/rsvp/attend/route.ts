import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isRsvpOpen } from "@/lib/event";

export const runtime = "nodejs";

// Records whether the guest is attending. This is the first RSVP step.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isRsvpOpen()) {
    return NextResponse.json({ ok: false, error: "rsvp_closed" }, { status: 403 });
  }

  let body: { attending?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }
  if (typeof body.attending !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }
  const attending = body.attending;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const res = await client.query<{ id: number }>(
      `INSERT INTO parties (contact_id, attending, updated_at)
            VALUES ($1, $2, now())
       ON CONFLICT (contact_id) DO UPDATE
          SET attending = $2,
              updated_at = now(),
              -- declining clears any previously-confirmed guest list
              submitted_at = CASE WHEN $2 = false THEN NULL ELSE parties.submitted_at END
       RETURNING id`,
      [session.contactId, attending]
    );
    if (!attending) {
      await client.query(`DELETE FROM party_members WHERE party_id = $1`, [
        res.rows[0].id,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true, attending });
}
