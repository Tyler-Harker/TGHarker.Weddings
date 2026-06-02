"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "saving" | "error" | "duplicate";

const inputClass =
  "w-full border border-accent-light bg-white/70 rounded-md px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-accent transition-colors";

export default function AddGuestForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function clearStatus() {
    if (status === "duplicate" || status === "error") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, partyName, email }),
      });
      if (res.ok) {
        setFirstName("");
        setLastName("");
        setPartyName("");
        setEmail("");
        setStatus("idle");
        router.refresh();
        return;
      }
      setStatus(res.status === 409 ? "duplicate" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-accent-light/60 bg-white/40 px-5 py-5 mb-5"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted font-sans mb-3">
        Add a guest
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          aria-label="First name"
          placeholder="First name *"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            clearStatus();
          }}
          className={inputClass}
        />
        <input
          aria-label="Last name"
          placeholder="Last name *"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            clearStatus();
          }}
          className={inputClass}
        />
        <input
          aria-label="Household"
          placeholder="Household (optional)"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          className={inputClass}
        />
        <input
          aria-label="Email"
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-accent px-6 py-2 font-sans text-sm uppercase tracking-[0.15em] text-white hover:bg-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Adding…" : "Add Guest"}
        </button>
        {status === "duplicate" && (
          <span className="text-sm font-sans text-red-700">
            That name is already on the list.
          </span>
        )}
        {status === "error" && (
          <span className="text-sm font-sans text-red-700">
            Couldn&apos;t add — please try again.
          </span>
        )}
      </div>
    </form>
  );
}
