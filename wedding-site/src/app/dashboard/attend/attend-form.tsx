"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeadlineNotice from "../deadline-notice";

const ATTEND_QUESTION =
  "Will you be able to attend our wedding in Arizona on November 21, 2026?";

interface AttendFormProps {
  initialAttending: boolean | null;
  rsvpOpen: boolean;
}

type Status = "idle" | "saving" | "error";

export default function AttendForm({
  initialAttending,
  rsvpOpen,
}: AttendFormProps) {
  const router = useRouter();
  const locked = !rsvpOpen;
  const [pending, setPending] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function choose(attending: boolean) {
    if (locked || status === "saving") return;
    setPending(attending);
    setStatus("saving");
    try {
      const res = await fetch("/api/rsvp/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      // Attending → on to the guest list; declining → back to the dashboard.
      router.push(attending ? "/dashboard/party" : "/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-block text-sm font-sans text-muted hover:text-accent transition-colors mb-4"
      >
        ← Back
      </Link>
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Step 1
      </p>
      <div className="mb-8">
        <DeadlineNotice open={rsvpOpen} />
      </div>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
        Will you attend?
      </h1>

      
      <h2 className="font-serif text-2xl text-foreground leading-snug mb-6">
        {ATTEND_QUESTION}
      </h2>

      {locked ? (
        <p className="font-sans text-muted">
          {initialAttending === true
            ? "Your response: Attending."
            : initialAttending === false
              ? "Your response: Not attending."
              : "RSVP is now closed."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => choose(true)}
              disabled={isSaving}
              className={`rounded-full px-8 py-3 font-sans text-sm uppercase tracking-[0.15em] transition-colors disabled:cursor-not-allowed ${
                initialAttending === true
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              } ${pending === true ? "opacity-70" : ""}`}
            >
              {pending === true && isSaving ? "Saving…" : "Joyfully Accept"}
            </button>
            <button
              type="button"
              onClick={() => choose(false)}
              disabled={isSaving}
              className={`rounded-full px-8 py-3 font-sans text-sm uppercase tracking-[0.15em] transition-colors disabled:cursor-not-allowed ${
                initialAttending === false
                  ? "bg-accent text-white"
                  : "border border-accent-light text-foreground hover:border-accent"
              } ${pending === false ? "opacity-70" : ""}`}
            >
              {pending === false && isSaving ? "Saving…" : "Regretfully Decline"}
            </button>
          </div>
          {status === "error" && (
            <p role="alert" className="mt-4 text-sm font-sans text-red-700">
              Something went wrong saving your response. Please try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}
