"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RSVP_DEADLINE_LABEL } from "@/lib/event";

type Status = "idle" | "loading" | "error";

export default function RsvpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (res.ok) {
        // Cookie is set by the response; head to the dashboard.
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Couple photo (matches the homepage) */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full border border-accent-light scale-110" />
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <Image
            src="/couple.jpeg"
            alt="Kylie and Tyler"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <p className="text-sm md:text-base uppercase tracking-[0.3em] text-muted font-sans mb-4">
        Kindly Respond
      </p>

      <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground mb-6 text-center">
        RSVP
      </h1>

      <p className="font-sans text-sm md:text-base text-muted text-center max-w-md mb-3 leading-relaxed">
        Please enter your name exactly as it appears on your invitation
        envelope so we can find your invitation.
      </p>

      <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted/80 text-center mb-10">
        Kindly respond by {RSVP_DEADLINE_LABEL}
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="firstName"
            className="text-xs uppercase tracking-[0.2em] text-muted font-sans"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full border border-accent-light bg-white/60 rounded-md px-4 py-3 font-serif text-lg text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="lastName"
            className="text-xs uppercase tracking-[0.2em] text-muted font-sans"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full border border-accent-light bg-white/60 rounded-md px-4 py-3 font-serif text-lg text-foreground outline-none focus:border-accent transition-colors"
          />
        </div>

        {status === "error" && (
          <div
            role="alert"
            className="rounded-md border border-accent-light bg-accent-light/10 px-4 py-4 text-sm font-sans text-foreground leading-relaxed"
          >
            We couldn&apos;t find that name on our guest list. Please
            double-check for typos and make sure it matches your invitation
            envelope exactly. Still stuck? Reach out to Tyler or Kylie directly
            and we&apos;ll get you sorted.
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Looking you up…" : "Find My Invitation"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-10 text-xs uppercase tracking-[0.2em] text-muted font-sans hover:text-accent transition-colors"
      >
        ← Back home
      </Link>

      <div className="text-accent-light text-2xl mt-10 tracking-[0.5em] font-serif">
        ✦
      </div>
    </main>
  );
}
