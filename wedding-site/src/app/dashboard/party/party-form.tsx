"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DeadlineNotice from "../deadline-notice";

interface Guest {
  firstName: string;
  lastName: string;
}

interface PartyFormProps {
  primaryName: string;
  initialGuests: Guest[];
  initialAttending: boolean | null;
  alreadySubmitted: boolean;
  rsvpOpen: boolean;
}

type Status = "idle" | "saving" | "error";

export default function PartyForm({
  primaryName,
  initialGuests,
  initialAttending,
  alreadySubmitted,
  rsvpOpen,
}: PartyFormProps) {
  const router = useRouter();
  const locked = !rsvpOpen;
  const [attending, setAttending] = useState<boolean>(initialAttending ?? true);
  const [bringingGuests, setBringingGuests] = useState(initialGuests.length > 0);
  const [guests, setGuests] = useState<Guest[]>(
    initialGuests.length > 0 ? initialGuests : [{ firstName: "", lastName: "" }]
  );
  const [status, setStatus] = useState<Status>("idle");

  function updateGuest(index: number, field: keyof Guest, value: string) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
    if (status === "error") setStatus("idle");
  }

  function addGuest() {
    setGuests((prev) => [...prev, { firstName: "", lastName: "" }]);
  }

  function removeGuest(index: number) {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setStatus("saving");

    const payloadGuests =
      attending && bringingGuests
        ? guests
            .map((g) => ({
              firstName: g.firstName.trim(),
              lastName: g.lastName.trim(),
            }))
            .filter((g) => g.firstName && g.lastName)
        : [];

    try {
      const res = await fetch("/api/rsvp/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending, guests: payloadGuests }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      // Attending → on to dinner; declined → back to the dashboard.
      router.push(attending ? "/dashboard/dinner" : "/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";

  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Step 1
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
        Your Party
      </h1>
      <p className="font-sans text-muted leading-relaxed mb-6">
        Let us know who&apos;s celebrating with you. We&apos;ll use this to plan
        seating and meals.
      </p>

      <div className="mb-8">
        <DeadlineNotice open={rsvpOpen} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Primary guest */}
        <div className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-1">
            Primary Guest
          </p>
          <p className="font-serif text-xl text-foreground">{primaryName}</p>
        </div>

        {/* Attending? */}
        <fieldset className="flex flex-col gap-3">
          <legend className="font-sans text-sm text-foreground mb-2">
            Will you be able to join us?
          </legend>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setAttending(true)}
              disabled={locked}
              className={`rounded-full px-6 py-2 font-sans text-sm transition-colors disabled:cursor-not-allowed ${
                attending
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              }`}
            >
              Joyfully Accept
            </button>
            <button
              type="button"
              onClick={() => setAttending(false)}
              disabled={locked}
              className={`rounded-full px-6 py-2 font-sans text-sm transition-colors disabled:cursor-not-allowed ${
                !attending
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              }`}
            >
              Regretfully Decline
            </button>
          </div>
        </fieldset>

        {!attending && (
          <p className="font-sans text-sm text-muted leading-relaxed -mt-2">
            We&apos;re sorry you can&apos;t make it — we&apos;ll miss you! Submit
            below to send your regrets. You can change your response any time
            before the deadline.
          </p>
        )}

        {/* Bringing guests? (only when attending) */}
        {attending && (
          <>
        <fieldset className="flex flex-col gap-3">
          <legend className="font-sans text-sm text-foreground mb-2">
            Will you be bringing any additional guests?
          </legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBringingGuests(true)}
              disabled={locked}
              className={`rounded-full px-6 py-2 font-sans text-sm transition-colors disabled:cursor-not-allowed ${
                bringingGuests
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setBringingGuests(false)}
              disabled={locked}
              className={`rounded-full px-6 py-2 font-sans text-sm transition-colors disabled:cursor-not-allowed ${
                !bringingGuests
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              }`}
            >
              No, just me
            </button>
          </div>
        </fieldset>

        {/* Guest list */}
        {bringingGuests && (
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans">
              Your Guests
            </p>
            {guests.map((guest, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 sm:flex-row sm:items-end rounded-lg border border-accent-light/40 p-3 sm:border-0 sm:p-0"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-muted font-sans">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={guest.firstName}
                    onChange={(e) =>
                      updateGuest(index, "firstName", e.target.value)
                    }
                    disabled={locked}
                    className="w-full border border-accent-light bg-white/60 rounded-md px-3 py-2 font-serif text-foreground outline-none focus:border-accent transition-colors disabled:opacity-70"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-muted font-sans">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={guest.lastName}
                    onChange={(e) =>
                      updateGuest(index, "lastName", e.target.value)
                    }
                    disabled={locked}
                    className="w-full border border-accent-light bg-white/60 rounded-md px-3 py-2 font-serif text-foreground outline-none focus:border-accent transition-colors disabled:opacity-70"
                  />
                </div>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => removeGuest(index)}
                    aria-label="Remove guest"
                    className="self-start sm:mb-1 px-3 py-2 text-muted hover:text-accent font-sans text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {!locked && (
              <button
                type="button"
                onClick={addGuest}
                className="self-start text-sm font-sans text-accent hover:text-foreground transition-colors"
              >
                + Add another guest
              </button>
            )}
          </div>
        )}
          </>
        )}

        {status === "error" && (
          <p role="alert" className="text-sm font-sans text-red-700">
            Something went wrong saving your party. Please try again.
          </p>
        )}

        {!locked && (
          <button
            type="submit"
            disabled={isSaving}
            className="self-start rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-foreground disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving
              ? "Saving…"
              : !attending
                ? "Send Regrets"
                : alreadySubmitted
                  ? "Update Party"
                  : "Save & Continue"}
          </button>
        )}
      </form>
    </div>
  );
}
