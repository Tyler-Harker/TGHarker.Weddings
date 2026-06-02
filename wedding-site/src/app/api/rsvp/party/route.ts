import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isRsvpOpen } from "@/lib/event";

export const runtime = "nodejs";

interface GuestInput {
  firstName: string;
  lastName: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isRsvpOpen()) {
    return NextResponse.json({ ok: false, error: "rsvp_closed" }, { status: 403 });
  }

  let body: { attending?: unknown; guests?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  // Only an explicit `false` declines; missing/true means attending.
  const attending = body.attending === false ? false : true;

  // Normalize the additional guests (the primary guest is added server-side).
  const rawGuests = Array.isArray(body.guests) ? body.guests : [];
  const guests: GuestInput[] = [];
  for (const g of rawGuests) {
    if (typeof g !== "object" || g === null) continue;
    const record = g as Record<string, unknown>;
    const firstName =
      typeof record.firstName === "string" ? record.firstName.trim() : "";
    const lastName =
      typeof record.lastName === "string" ? record.lastName.trim() : "";
    if (firstName && lastName) guests.push({ firstName, lastName });
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const partyRes = await client.query<{ id: number }>(
      `INSERT INTO parties (contact_id, attending, submitted_at, updated_at)
            VALUES ($1, $2, now(), now())
       ON CONFLICT (contact_id)
       DO UPDATE SET attending = $2, submitted_at = now(), updated_at = now()
       RETURNING id`,
      [session.contactId, attending]
    );
    const partyId = partyRes.rows[0].id;

    if (!attending) {
      // Declined — deactivate the whole guest list (incl. the primary member).
      await client.query(`DELETE FROM party_members WHERE party_id = $1`, [
        partyId,
      ]);
    } else {
      // Ensure a primary member exists and reflects the logged-in guest's name.
      await client.query(
        `INSERT INTO party_members (party_id, first_name, last_name, is_primary)
              SELECT $1, $2, $3, true
               WHERE NOT EXISTS (
                 SELECT 1 FROM party_members WHERE party_id = $1 AND is_primary
               )`,
        [partyId, session.firstName, session.lastName]
      );
      await client.query(
        `UPDATE party_members
            SET first_name = $2, last_name = $3
          WHERE party_id = $1 AND is_primary`,
        [partyId, session.firstName, session.lastName]
      );

      // Replace the set of additional guests.
      await client.query(
        `DELETE FROM party_members WHERE party_id = $1 AND is_primary = false`,
        [partyId]
      );
      for (const guest of guests) {
        await client.query(
          `INSERT INTO party_members (party_id, first_name, last_name, is_primary)
                VALUES ($1, $2, $3, false)`,
          [partyId, guest.firstName, guest.lastName]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}
