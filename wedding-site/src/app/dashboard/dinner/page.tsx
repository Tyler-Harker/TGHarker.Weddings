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
  // Walk the steps in order.
  if (!state.attendAnswered) redirect("/dashboard/attend");
  // Declined guests have no meals to choose.
  if (state.declined) redirect("/dashboard");
  // Meals are per party member, so the guest list must be confirmed first.
  if (!state.submitted) redirect("/dashboard/party");

  return (
    <>
      {/* Mobile-only: the sidebar (with its step progress) is hidden on phones. */}
      <div className="md:hidden mb-8">
        <RsvpProgress
          attendDone={state.attendAnswered}
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
