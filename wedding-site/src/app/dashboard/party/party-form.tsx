"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeadlineNotice from "../deadline-notice";

interface Guest {
  firstName: string;
  lastName: string;
}

interface PartyFormProps {
  primaryName: string;
  initialGuests: Guest[];
  maxPartySize: number;
  rsvpOpen: boolean;
}

type Status = "idle" | "saving" | "error";

const inputClass =
  "w-full border border-accent-light bg-white/60 rounded-md px-3 py-2 font-serif text-foreground outline-none focus:border-accent transition-colors disabled:opacity-70";

export default function PartyForm({
  primaryName,
  initialGuests,
  maxPartySize,
  rsvpOpen,
}: PartyFormProps) {
  const router = useRouter();
  const locked = !rsvpOpen;
  const [bringingGuests, setBringingGuests] = useState(initialGuests.length > 0);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [current, setCurrent] = useState<Guest>({ firstName: "", lastName: "" });
  const [adding, setAdding] = useState(initialGuests.length === 0);
  const [status, setStatus] = useState<Status>("idle");
  const [showSizeModal, setShowSizeModal] = useState(false);

  const isSaving = status === "saving";
  const currentValid =
    current.firstName.trim() !== "" && current.lastName.trim() !== "";
  // Total party = the primary guest + the additional guests.
  const partySize = 1 + guests.length;
  const atMax = partySize >= maxPartySize;

  function removeGuest(index: number) {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  // "Add Guest" — commit the typed guest, then show the party list.
  function addGuest() {
    if (!currentValid) return;
    if (atMax) {
      setShowSizeModal(true);
      return;
    }
    setGuests((prev) => [
      ...prev,
      { firstName: current.firstName.trim(), lastName: current.lastName.trim() },
    ]);
    setCurrent({ firstName: "", lastName: "" });
    setAdding(false);
  }

  // "Add another guest" — go back to the entry form for the next guest.
  function addAnother() {
    if (atMax) {
      setShowSizeModal(true);
      return;
    }
    setCurrent({ firstName: "", lastName: "" });
    setAdding(true);
  }

  function back() {
    if (adding && guests.length > 0) {
      setAdding(false);
      return;
    }
    setBringingGuests(false);
  }

  async function save(guestList: Guest[]) {
    if (locked) return;
    setStatus("saving");
    const payload = guestList
      .map((g) => ({ firstName: g.firstName.trim(), lastName: g.lastName.trim() }))
      .filter((g) => g.firstName && g.lastName);
    try {
      const res = await fetch("/api/rsvp/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: payload }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      router.push("/dashboard/dinner");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  function partyList(editable: boolean) {
    return (
      <ul className="rounded-lg border border-accent-light/40 divide-y divide-accent-light/30">
        <li className="flex items-center justify-between px-4 py-2.5">
          <span className="font-serif text-foreground">{primaryName}</span>
          <span className="text-xs font-sans text-muted">You</span>
        </li>
        {guests.map((g, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="font-serif text-foreground">
              {g.firstName} {g.lastName}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => removeGuest(i)}
                className="text-xs font-sans text-muted hover:text-red-700 transition-colors"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // ---- Read-only (after the deadline) ----
  if (locked) {
    return (
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
          Step 2
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
          Your Party
        </h1>
        <div className="mb-8">
          <DeadlineNotice open={rsvpOpen} />
        </div>
        {partyList(false)}
      </div>
    );
  }

  // ---- Guest management (after choosing "Yes") ----
  if (bringingGuests) {
    return (
      <div className="max-w-2xl">
        <button
          type="button"
          onClick={back}
          className="text-sm font-sans text-muted hover:text-accent transition-colors"
        >
          ← Back
        </button>

        <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground mt-3 mb-5">
          Your Party
        </h1>

        {adding ? (
          /* Entry form — the party summary stays visible above it */
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-2">
                Your Party
              </p>
              <div className="mb-2">{partyList(true)}</div>
              <p className="text-xs font-sans text-muted">
                {partySize} of {maxPartySize} in your party
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans">
                Add a guest
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  aria-label="Guest first name"
                  placeholder="First name"
                  value={current.firstName}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, firstName: e.target.value }))
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  aria-label="Guest last name"
                  placeholder="Last name"
                  value={current.lastName}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, lastName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              {currentValid && (
                <button
                  type="button"
                  onClick={addGuest}
                  className="self-start rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.15em] text-white hover:bg-foreground transition-colors"
                >
                  Add Guest
                </button>
              )}
            </div>
          </div>
        ) : (
          /* The party list + next actions */
          <>
            <div className="mb-2">{partyList(true)}</div>
            <p className="text-xs font-sans text-muted mb-6">
              {partySize} of {maxPartySize} in your party
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={addAnother}
                className="rounded-full border border-accent-light px-6 py-3 font-sans text-sm uppercase tracking-[0.15em] text-foreground hover:border-accent transition-colors"
              >
                Add another guest
              </button>
              <button
                type="button"
                onClick={() => save(guests)}
                disabled={isSaving}
                className="rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.15em] text-white hover:bg-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : "Choose Dinner Options"}
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <p role="alert" className="mt-4 text-sm font-sans text-red-700">
            Something went wrong saving your party. Please try again.
          </p>
        )}

        {showSizeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/30"
            role="dialog"
            aria-modal="true"
          >
            <div className="animate-pop-in max-w-sm w-full rounded-2xl border border-accent-light/60 bg-background shadow-xl px-6 py-7 text-center">
              <h3 className="font-serif text-xl text-foreground mb-3">
                Party size reached
              </h3>
              <p className="font-sans text-sm text-muted leading-relaxed mb-6">
                Due to venue constraints, we have only allocated a group size of{" "}
                {maxPartySize} for you. If you must bring additional (children
                included), please reach out to Tyler or Kylie to adjust your
                party size.
              </p>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.15em] text-white hover:bg-foreground transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- The question (default) ----
  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/attend"
        className="inline-block text-sm font-sans text-muted hover:text-accent transition-colors mb-4"
      >
        ← Back
      </Link>
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Step 2
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
        Your Party
      </h1>

      <div className="mb-8">
        <DeadlineNotice open={rsvpOpen} />
      </div>

      <div className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-4 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-1">
          Primary Guest
        </p>
        <p className="font-serif text-xl text-foreground">{primaryName}</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-sans text-sm text-foreground mb-2">
          Are you bringing any additional guests?
        </legend>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => save([])}
            disabled={isSaving}
            className="rounded-full px-6 py-2 font-sans text-sm transition-colors border border-accent-light text-foreground hover:border-accent disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "No, just me"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(guests.length === 0);
              setBringingGuests(true);
            }}
            className="rounded-full px-6 py-2 font-sans text-sm transition-colors border border-accent-light text-foreground hover:border-accent"
          >
            Yes
          </button>
        </div>
      </fieldset>

      {status === "error" && (
        <p role="alert" className="mt-6 text-sm font-sans text-red-700">
          Something went wrong saving your party. Please try again.
        </p>
      )}
    </div>
  );
}
