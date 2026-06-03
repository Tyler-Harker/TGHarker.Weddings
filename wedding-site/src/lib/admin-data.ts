import { query } from "@/lib/db";
import type { MealChoice } from "@/lib/meals";

export interface AdminContactProgress {
  contactId: number;
  name: string;
  signedIn: boolean;
  signedInLabel: string | null;
  attendAnswered: boolean;
  partySubmitted: boolean;
  declined: boolean;
  mealsComplete: boolean;
  memberCount: number;
  mealsChosen: number;
  maxPartySize: number;
}

export interface AdminGuest {
  name: string;
  isPrimary: boolean;
  meal: MealChoice | null;
  addedBy: string;
}

export interface AdminSummary {
  invited: number;
  signedIn: number;
  responded: number; // party submitted (attending or declined)
  attending: number;
  declined: number;
  totalGuests: number;
  meals: { fried_chicken: number; brisket: number; unselected: number };
  contacts: AdminContactProgress[];
  guests: AdminGuest[];
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const mealsRes = await query<{
    fried_chicken: number;
    brisket: number;
    unselected: number;
    total: number;
  }>(
    `SELECT
       count(*) FILTER (WHERE meal_choice = 'fried_chicken')::int AS fried_chicken,
       count(*) FILTER (WHERE meal_choice = 'brisket')::int        AS brisket,
       count(*) FILTER (WHERE meal_choice IS NULL)::int            AS unselected,
       count(*)::int                                               AS total
     FROM party_members`
  );

  // Every invited contact, with their progress through each stage.
  const progressRes = await query<{
    id: number;
    first_name: string;
    last_name: string;
    signed_in: boolean;
    last_signed_in_at: Date | null;
    party_submitted: boolean;
    attending: boolean | null;
    member_count: number;
    meals_chosen: number;
    max_party_size: number;
  }>(
    `SELECT c.id,
            c.first_name,
            c.last_name,
            (c.last_signed_in_at IS NOT NULL) AS signed_in,
            c.last_signed_in_at,
            (p.id IS NOT NULL AND p.submitted_at IS NOT NULL) AS party_submitted,
            p.attending AS attending,
            c.max_party_size,
            COALESCE(m.member_count, 0) AS member_count,
            COALESCE(m.meals_chosen, 0) AS meals_chosen
       FROM contacts c
       LEFT JOIN parties p ON p.contact_id = c.id
       LEFT JOIN (
         SELECT party_id,
                count(*)::int AS member_count,
                count(*) FILTER (WHERE meal_choice IS NOT NULL)::int AS meals_chosen
           FROM party_members
          GROUP BY party_id
       ) m ON m.party_id = p.id
      ORDER BY c.last_name, c.first_name`
  );

  const guestsRes = await query<{
    first_name: string;
    last_name: string;
    is_primary: boolean;
    meal_choice: MealChoice | null;
    added_first: string;
    added_last: string;
  }>(
    `SELECT pm.first_name, pm.last_name, pm.is_primary, pm.meal_choice,
            c.first_name AS added_first, c.last_name AS added_last
       FROM party_members pm
       JOIN parties p ON p.id = pm.party_id
       JOIN contacts c ON c.id = p.contact_id
      ORDER BY c.last_name, c.first_name, pm.is_primary DESC, pm.id`
  );

  const contacts: AdminContactProgress[] = progressRes.rows.map((r) => {
    const declined = r.attending === false;
    return {
      contactId: r.id,
      name: `${r.first_name} ${r.last_name}`,
      signedIn: r.signed_in,
      signedInLabel: r.last_signed_in_at
        ? r.last_signed_in_at.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
        : null,
      attendAnswered: r.attending !== null,
      partySubmitted: r.party_submitted,
      declined,
      mealsComplete:
        !declined &&
        r.party_submitted &&
        r.member_count > 0 &&
        r.meals_chosen === r.member_count,
      memberCount: r.member_count,
      mealsChosen: r.meals_chosen,
      maxPartySize: r.max_party_size,
    };
  });

  const guests: AdminGuest[] = guestsRes.rows.map((r) => ({
    name: `${r.first_name} ${r.last_name}`,
    isPrimary: r.is_primary,
    meal: r.meal_choice,
    addedBy: `${r.added_first} ${r.added_last}`,
  }));

  const meals = mealsRes.rows[0];

  return {
    invited: contacts.length,
    signedIn: contacts.filter((c) => c.signedIn).length,
    responded: contacts.filter((c) => c.attendAnswered).length,
    attending: contacts.filter((c) => c.attendAnswered && !c.declined).length,
    declined: contacts.filter((c) => c.declined).length,
    totalGuests: meals.total,
    meals: {
      fried_chicken: meals.fried_chicken,
      brisket: meals.brisket,
      unselected: meals.unselected,
    },
    contacts,
    guests,
  };
}
