import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isMealChoice } from "@/lib/meals";
import { isRsvpOpen } from "@/lib/event";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isRsvpOpen()) {
    return NextResponse.json({ ok: false, error: "rsvp_closed" }, { status: 403 });
  }

  let body: { selections?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 }
    );
  }

  const partyRes = await query<{ id: number }>(
    `SELECT id FROM parties WHERE contact_id = $1`,
    [session.contactId]
  );
  const party = partyRes.rows[0];
  if (!party) {
    return NextResponse.json({ ok: false, error: "no_party" }, { status: 400 });
  }

  const rawSelections = Array.isArray(body.selections) ? body.selections : [];
  for (const selection of rawSelections) {
    if (typeof selection !== "object" || selection === null) continue;
    const record = selection as Record<string, unknown>;
    const memberId = Number(record.memberId);
    const choice = record.choice;
    if (!Number.isInteger(memberId) || !isMealChoice(choice)) continue;

    // Scoped to this party so a guest can only set meals for their own members.
    await query(
      `UPDATE party_members
          SET meal_choice = $1
        WHERE id = $2 AND party_id = $3`,
      [choice, memberId, party.id]
    );
  }

  return NextResponse.json({ ok: true });
}
