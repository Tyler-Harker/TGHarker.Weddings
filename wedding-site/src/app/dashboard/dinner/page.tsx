import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPartyState } from "@/lib/rsvp";
import { isRsvpOpen } from "@/lib/event";
import RsvpProgress from "../rsvp-progress";
import DinnerForm from "./dinner-form";

export default async function DinnerPage() {
  const session = await getSession();
  if (!session) redirect("/rsvp");

  const state = await getPartyState(session.contactId);
  // Meals are per party member, so the party must be defined first.
  if (!state.submitted) redirect("/dashboard/party");
  // Declined guests have no meals to choose.
  if (state.declined) redirect("/dashboard");

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
      <DinnerForm
        members={state.members.map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          mealChoice: m.mealChoice,
        }))}
        rsvpOpen={isRsvpOpen()}
      />
    </>
  );
}
