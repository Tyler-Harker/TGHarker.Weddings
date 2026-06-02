import { getSession } from "@/lib/session";
import { getPartyState } from "@/lib/rsvp";
import DashboardNav from "./dashboard-nav";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const firstName = session?.firstName ?? "Guest";
  const state = session ? await getPartyState(session.contactId) : null;

  return (
    <div className="min-h-screen md:flex">
      <DashboardNav
        firstName={firstName}
        partyDone={state?.partyComplete ?? false}
        mealsDone={state?.mealsComplete ?? false}
        declined={state?.declined ?? false}
      />
      <main className="flex-1 px-5 py-8 md:px-12 md:py-10">{children}</main>
    </div>
  );
}
