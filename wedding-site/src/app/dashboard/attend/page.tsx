import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPartyState } from "@/lib/rsvp";
import { isRsvpOpen } from "@/lib/event";
import RsvpProgress from "../rsvp-progress";
import AttendForm from "./attend-form";

export default async function AttendPage() {
  const session = await getSession();
  if (!session) redirect("/rsvp");

  const state = await getPartyState(session.contactId);

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
      <AttendForm
        initialAttending={state.attending}
        rsvpOpen={isRsvpOpen()}
      />
    </>
  );
}
