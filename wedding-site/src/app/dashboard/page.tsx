import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPartyState } from "@/lib/rsvp";
import { isRsvpOpen } from "@/lib/event";
import DeadlineNotice from "./deadline-notice";
import RsvpProgress from "./rsvp-progress";

function StatusBadge({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-sans text-green-700">
      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-accent-light/20 px-3 py-1 text-xs font-sans text-muted">
      To do
    </span>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/rsvp");

  const state = await getPartyState(session.contactId);
  const partyDone = state.partyComplete;
  const mealsDone = state.mealsComplete;
  const declined = state.declined;
  const allDone = partyDone && mealsDone;

  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Guest Dashboard
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
        Welcome, {session.firstName}
      </h1>
      <p className="font-sans text-muted leading-relaxed mb-10">
        {declined
          ? "You've let us know you can't make it — we'll miss you! You can change your response any time before the deadline."
          : allDone
            ? "Your RSVP is complete — thank you!"
            : "Let's get your RSVP wrapped up. Complete the steps below."}
      </p>

      <div className="mb-6">
        <RsvpProgress
          partyDone={partyDone}
          mealsDone={mealsDone}
          declined={declined}
        />
      </div>

      <div className="mb-8">
        <DeadlineNotice open={isRsvpOpen()} />
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/party"
          className="flex items-center justify-between rounded-lg border border-accent-light/60 bg-white/40 px-6 py-5 hover:border-accent transition-colors"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-1">
              Step 1
            </p>
            <p className="font-serif text-xl text-foreground">Your Party</p>
            <p className="font-sans text-sm text-muted mt-1">
              {declined ? "You've declined — tap to change." : "Tell us who's coming."}
            </p>
          </div>
          <StatusBadge done={partyDone} />
        </Link>

        {declined ? null : partyDone ? (
          <Link
            href="/dashboard/dinner"
            className="flex items-center justify-between rounded-lg border border-accent-light/60 bg-white/40 px-6 py-5 hover:border-accent transition-colors"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-1">
                Step 2
              </p>
              <p className="font-serif text-xl text-foreground">Dinner Choices</p>
              <p className="font-sans text-sm text-muted mt-1">
                Pick a meal for everyone in your party.
              </p>
            </div>
            <StatusBadge done={mealsDone} />
          </Link>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-accent-light/30 bg-white/20 px-6 py-5 opacity-70">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-1">
                Step 2
              </p>
              <p className="font-serif text-xl text-muted">Dinner Choices</p>
              <p className="font-sans text-sm text-muted mt-1">
                Complete Your Party to unlock.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
