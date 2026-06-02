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
  submitted: boolean; // "Your Party" step complete
  attending: boolean | null; // null until answered; false = declined
  declined: boolean;
  members: PartyMember[];
  partyComplete: boolean;
  mealsComplete: boolean; // attending && every member has a meal
  rsvpComplete: boolean; // declined, or attending with all meals chosen
}

interface PartyRow {
  id: number;
  submitted_at: Date | null;
  attending: boolean | null;
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
    `SELECT id, submitted_at, attending FROM parties WHERE contact_id = $1`,
    [contactId]
  );
  const party = partyRes.rows[0];

  if (!party) {
    return {
      partyId: null,
      submitted: false,
      attending: null,
      declined: false,
      members: [],
      partyComplete: false,
      mealsComplete: false,
      rsvpComplete: false,
    };
  }

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
    declined,
    members,
    partyComplete: submitted,
    mealsComplete,
    rsvpComplete: declined || mealsComplete,
  };
}
