import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPartyState } from "@/lib/rsvp";
import { isRsvpOpen } from "@/lib/event";
import RsvpProgress from "../rsvp-progress";
import PartyForm from "./party-form";

export default async function PartyPage() {
  const session = await getSession();
  if (!session) redirect("/rsvp");

  const state = await getPartyState(session.contactId);
  const initialGuests = state.members
    .filter((m) => !m.isPrimary)
    .map((m) => ({ firstName: m.firstName, lastName: m.lastName }));

  return (
    <>
      {/* Mobile-only: the sidebar (with its step progress) is hidden on phones. */}
      <div className="md:hidden mb-8">
        <RsvpProgress
          partyDone={state.partyComplete}
          mealsDone={state.mealsComplete}
          declined={state.declined}
        />
      </div>
      <PartyForm
        primaryName={`${session.firstName} ${session.lastName}`}
        initialGuests={initialGuests}
        initialAttending={state.attending}
        alreadySubmitted={state.submitted}
        rsvpOpen={isRsvpOpen()}
      />
    </>
  );
}
