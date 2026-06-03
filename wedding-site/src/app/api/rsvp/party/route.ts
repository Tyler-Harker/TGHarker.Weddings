import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isRsvpOpen } from "@/lib/event";

export const runtime = "nodejs";

interface GuestInput {
  firstName: string;
  lastName: string;
}

// Saves the guest list. Requires the attendance step (attending = true) first.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isRsvpOpen()) {
    return NextResponse.json({ ok: false, error: "rsvp_closed" }, { status: 403 });
  }

  let body: { guests?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

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

    const partyRes = await client.query<{
      id: number;
      attending: boolean | null;
      max_party_size: number;
    }>(
      `SELECT p.id, p.attending, c.max_party_size
         FROM parties p
         JOIN contacts c ON c.id = p.contact_id
        WHERE p.contact_id = $1`,
      [session.contactId]
    );
    const party = partyRes.rows[0];
    if (!party || party.attending !== true) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { ok: false, error: "not_attending" },
        { status: 400 }
      );
    }
    // Total party = the primary guest + the additional guests.
    if (1 + guests.length > party.max_party_size) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { ok: false, error: "party_too_large", maxPartySize: party.max_party_size },
        { status: 400 }
      );
    }
    const partyId = party.id;

    // Ensure the primary member exists and reflects the logged-in guest's name.
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

    // Mark the guest-list step complete.
    await client.query(
      `UPDATE parties SET submitted_at = now(), updated_at = now() WHERE id = $1`,
      [partyId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}
