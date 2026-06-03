import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { getAdminSummary } from "@/lib/admin-data";
import { MEAL_OPTIONS, type MealChoice } from "@/lib/meals";
import AdminLogoutButton from "./admin-logout-button";
import QrGenerator from "./qr-generator";
import AddGuestForm from "./add-guest-form";
import RemoveContactButton from "./remove-contact-button";
import MaxPartyEditor from "./max-party-editor";

const MEAL_LABEL: Record<MealChoice, string> = Object.fromEntries(
  MEAL_OPTIONS.map((m) => [m.id, m.name])
) as Record<MealChoice, string>;

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-2">
        {label}
      </p>
      <p className="font-serif text-3xl text-foreground">{value}</p>
    </div>
  );
}

function StageCheck({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-green-600" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
      <span className="sr-only">Complete</span>
    </span>
  ) : (
    <span className="text-muted/40" aria-label="Incomplete">
      —
    </span>
  );
}

export default async function AdminPage() {
  // Proxy already guards this, but verify server-side as defense in depth.
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const s = await getAdminSummary();
  const notSignedIn = s.invited - s.signedIn;

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-1">
            Tyler &amp; Kylie
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground">
            RSVP Admin
          </h1>
        </div>
        <AdminLogoutButton />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Invited" value={s.invited} />
        <SummaryCard label="Signed In" value={`${s.signedIn}/${s.invited}`} />
        <SummaryCard label="Attending" value={s.attending} />
        <SummaryCard label="Declined" value={s.declined} />
      </div>

      {/* Headcount + meal breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Total Guests" value={s.totalGuests} />
        <SummaryCard label={MEAL_LABEL.fried_chicken} value={s.meals.fried_chicken} />
        <SummaryCard label={MEAL_LABEL.brisket} value={s.meals.brisket} />
        <SummaryCard label="No selection yet" value={s.meals.unselected} />
      </div>

      {/* Guest list management + progress across the full invite list */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <h2 className="font-serif text-2xl text-foreground">Guest List</h2>
          <p className="font-sans text-sm text-muted">
            {s.invited} invited · {s.signedIn} signed in · {notSignedIn} not yet
          </p>
        </div>
        <AddGuestForm />
        <div className="overflow-x-auto rounded-lg border border-accent-light/60">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-accent-light/15 text-muted uppercase tracking-[0.1em] text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Invited Guest</th>
                <th className="px-4 py-3 font-medium">Signed In</th>
                <th className="px-4 py-3 font-medium text-center">Your Party</th>
                <th className="px-4 py-3 font-medium text-center">Dinner</th>
                <th className="px-4 py-3 font-medium text-center">Party Size</th>
                <th className="px-4 py-3 font-medium text-center">Max Party</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {s.contacts.map((c) => (
                <tr
                  key={c.contactId}
                  className={`border-t border-accent-light/40 ${
                    c.signedIn ? "" : "bg-accent-light/5"
                  }`}
                >
                  <td
                    className={`px-4 py-3 font-serif text-base ${
                      c.signedIn ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {c.name}
                    {c.declined && (
                      <span className="ml-2 align-middle inline-flex items-center rounded-full bg-accent-light/30 px-2 py-0.5 text-[0.65rem] font-sans uppercase tracking-wide text-muted">
                        Declined
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.signedIn ? (
                      <span className="text-foreground">
                        {c.signedInLabel}
                      </span>
                    ) : (
                      <span className="text-muted/60">Not yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StageCheck done={c.partySubmitted} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.declined ? (
                      <span className="text-muted/50" aria-label="Not attending">
                        —
                      </span>
                    ) : (
                      <StageCheck done={c.mealsComplete} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-muted">
                    {c.partySubmitted && !c.declined ? c.memberCount : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <MaxPartyEditor id={c.contactId} value={c.maxPartySize} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RemoveContactButton
                      id={c.contactId}
                      name={c.name}
                      hasResponded={c.partySubmitted}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All guests (incl. plus-ones) and who added them */}
      <section>
        <h2 className="font-serif text-2xl text-foreground mb-4">
          All Guests ({s.guests.length})
        </h2>
        {s.guests.length === 0 ? (
          <p className="font-sans text-sm text-muted">No guests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-accent-light/60">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-accent-light/15 text-muted uppercase tracking-[0.1em] text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Added by (RSVP)</th>
                  <th className="px-4 py-3 font-medium">Meal</th>
                </tr>
              </thead>
              <tbody>
                {s.guests.map((g, i) => (
                  <tr key={i} className="border-t border-accent-light/40">
                    <td className="px-4 py-3 font-serif text-base text-foreground">
                      {g.name}
                      {g.isPrimary && (
                        <span className="ml-2 text-xs font-sans text-muted">
                          (primary)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{g.addedBy}</td>
                    <td className="px-4 py-3">
                      {g.meal ? (
                        MEAL_LABEL[g.meal]
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QR code generator */}
      <section className="mt-12">
        <h2 className="font-serif text-2xl text-foreground mb-2">QR Code</h2>
        <p className="font-sans text-sm text-muted mb-4">
          Generate a QR code for any page on this site. It uses the domain you&apos;re
          currently viewing from.
        </p>
        <QrGenerator />
      </section>
    </main>
  );
}
