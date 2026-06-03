import { query } from "@/lib/db";
import type { MealChoice } from "@/lib/meals";

export interface PartyMember {
  id: number;
  firstName: string;
  lastName: string;
  isPrimary: boolean;
  mealChoice: MealChoice | null;
}

export interface PartyState {
  partyId: number | null;
  submitted: boolean; // guest-list ("Your Party") step complete
  attending: boolean | null; // null until answered; false = declined
  attendAnswered: boolean; // the attendance step has been answered
  declined: boolean;
  members: PartyMember[];
  maxPartySize: number; // total people allowed, including the primary guest
  partyComplete: boolean;
  mealsComplete: boolean; // attending && every member has a meal
  rsvpComplete: boolean; // declined, or attending with all meals chosen
}

interface PartyRow {
  id: number | null;
  submitted_at: Date | null;
  attending: boolean | null;
  max_party_size: number;
}

interface MemberRow {
  id: number;
  first_name: string;
  last_name: string;
  is_primary: boolean;
  meal_choice: MealChoice | null;
}

export async function getPartyState(contactId: number): Promise<PartyState> {
  const partyRes = await query<PartyRow>(
    `SELECT p.id, p.submitted_at, p.attending, c.max_party_size
       FROM contacts c
       LEFT JOIN parties p ON p.contact_id = c.id
      WHERE c.id = $1`,
    [contactId]
  );
  const row = partyRes.rows[0];
  const maxPartySize = row?.max_party_size ?? 2;

  if (!row || row.id === null) {
    return {
      partyId: null,
      submitted: false,
      attending: null,
      attendAnswered: false,
      declined: false,
      members: [],
      maxPartySize,
      partyComplete: false,
      mealsComplete: false,
      rsvpComplete: false,
    };
  }
  const party = { id: row.id, submitted_at: row.submitted_at, attending: row.attending };

  const memRes = await query<MemberRow>(
    `SELECT id, first_name, last_name, is_primary, meal_choice
       FROM party_members
      WHERE party_id = $1
      ORDER BY is_primary DESC, id ASC`,
    [party.id]
  );

  const members: PartyMember[] = memRes.rows.map((r) => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    isPrimary: r.is_primary,
    mealChoice: r.meal_choice,
  }));

  const submitted = party.submitted_at !== null;
  const attendAnswered = party.attending !== null;
  const declined = party.attending === false;
  const mealsComplete =
    !declined &&
    submitted &&
    members.length > 0 &&
    members.every((m) => m.mealChoice !== null);

  return {
    partyId: party.id,
    submitted,
    attending: party.attending,
    attendAnswered,
    declined,
    members,
    maxPartySize,
    partyComplete: submitted,
    mealsComplete,
    rsvpComplete: declined || mealsComplete,
  };
}
