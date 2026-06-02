"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MEAL_OPTIONS, type MealChoice } from "@/lib/meals";
import DeadlineNotice from "../deadline-notice";

interface MemberInput {
  id: number;
  name: string;
  mealChoice: MealChoice | null;
}

interface DinnerFormProps {
  members: MemberInput[];
  rsvpOpen: boolean;
}

type Status = "idle" | "saving" | "saved" | "error";

const MEAL_LABEL: Record<MealChoice, string> = Object.fromEntries(
  MEAL_OPTIONS.map((m) => [m.id, m.name])
) as Record<MealChoice, string>;

function SelectedBadge() {
  return (
    <span className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white">
      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DinnerForm({ members, rsvpOpen }: DinnerFormProps) {
  const router = useRouter();
  const locked = !rsvpOpen;
  const [selections, setSelections] = useState<Record<number, MealChoice | null>>(
    () => Object.fromEntries(members.map((m) => [m.id, m.mealChoice]))
  );
  const [status, setStatus] = useState<Status>("idle");
  // Mobile stepper: when set, re-ask an already-answered member.
  const [editingId, setEditingId] = useState<number | null>(null);
  // Mobile: brief "saved" confirmation shown before advancing to the next guest.
  const [confirming, setConfirming] = useState<{
    memberId: number;
    name: string;
    choice: MealChoice;
  } | null>(null);

  const allChosen = members.every((m) => selections[m.id]);

  async function persist(payload: { memberId: number; choice: MealChoice }[]) {
    const res = await fetch("/api/rsvp/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections: payload }),
    });
    if (!res.ok) throw new Error("save failed");
  }

  // ---- Desktop: pick into local state, batch-saved with the button ----
  function choose(memberId: number, choice: MealChoice) {
    if (locked) return;
    setSelections((prev) => ({ ...prev, [memberId]: choice }));
    if (status !== "saving") setStatus("idle");
  }

  async function save() {
    if (locked) return;
    setStatus("saving");
    const payload = members
      .filter((m) => selections[m.id])
      .map((m) => ({ memberId: m.id, choice: selections[m.id] as MealChoice }));
    try {
      await persist(payload);
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  // ---- Mobile: one member at a time, saved as you go ----
  async function pickAndSave(member: MemberInput, choice: MealChoice) {
    if (locked || confirming) return;
    // Show a confirmation for a beat so the choice registers before advancing.
    setConfirming({ memberId: member.id, name: member.name, choice });
    setStatus("saving");
    try {
      await Promise.all([persist([{ memberId: member.id, choice }]), delay(1500)]);
      setSelections((prev) => ({ ...prev, [member.id]: choice }));
      setEditingId(null);
      setConfirming(null);
      setStatus("saved");
      router.refresh();
    } catch {
      setConfirming(null);
      setStatus("error");
    }
  }

  // The current mobile question: an explicit edit target, else the first member
  // who hasn't chosen yet.
  const pending = members.filter((m) => !selections[m.id]);
  const current =
    editingId != null
      ? members.find((m) => m.id === editingId) ?? null
      : pending[0] ?? null;
  const answeredCount = members.length - pending.length;

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">
        Step 2
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
        Dinner Choices
      </h1>
      <p className="font-sans text-muted leading-relaxed mb-6">
        Choose a main course for each member of your party.
      </p>

      <div className="mb-8 md:mb-10">
        <DeadlineNotice open={rsvpOpen} />
      </div>

      {/* ===================== MOBILE: one member at a time ===================== */}
      <div className="md:hidden">
        {locked ? (
          <ul className="flex flex-col divide-y divide-accent-light/40 rounded-lg border border-accent-light/60">
            {members.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <p className="font-serif text-lg text-foreground">{m.name}</p>
                <p className="font-sans text-sm text-muted">
                  {selections[m.id] ? MEAL_LABEL[selections[m.id]!] : "No selection"}
                </p>
              </li>
            ))}
          </ul>
        ) : current ? (
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted mb-2">
              {editingId != null
                ? "Update selection"
                : `Guest ${answeredCount + 1} of ${members.length}`}
            </p>
            <h2 className="font-serif text-2xl text-foreground mb-5">
              {current.name}
            </h2>

            <div className="flex flex-col gap-4">
              {MEAL_OPTIONS.map((option) => {
                const selected =
                  selections[current.id] === option.id ||
                  (confirming?.memberId === current.id &&
                    confirming?.choice === option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => pickAndSave(current, option.id)}
                    aria-pressed={selected}
                    className={`text-left rounded-lg overflow-hidden border-2 transition-colors ${
                      selected
                        ? "border-accent ring-2 ring-accent/30"
                        : "border-transparent"
                    }`}
                  >
                    <div className="relative w-full h-52 bg-accent-light/20">
                      <Image
                        src={option.image}
                        alt={option.name}
                        fill
                        sizes="100vw"
                        className="object-cover"
                      />
                      {selected && <SelectedBadge />}
                    </div>
                    <div className="px-4 py-3 bg-white/50">
                      <p className="font-serif text-lg text-foreground">
                        {option.name}
                      </p>
                      <p className="font-sans text-sm text-muted mt-1">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* progress dots */}
            <div className="mt-6 flex items-center gap-1.5">
              {members.map((m) => (
                <span
                  key={m.id}
                  className={`h-1.5 rounded-full transition-all ${
                    selections[m.id]
                      ? "bg-accent w-6"
                      : current.id === m.id
                        ? "bg-accent/50 w-6"
                        : "bg-accent-light/40 w-3"
                  }`}
                />
              ))}
            </div>

            {editingId != null && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="mt-6 text-sm font-sans text-muted hover:text-accent transition-colors"
              >
                ← Back to summary
              </button>
            )}
            {status === "error" && (
              <p role="alert" className="mt-4 text-sm font-sans text-red-700">
                Something went wrong saving. Please try again.
              </p>
            )}
          </div>
        ) : (
          /* Everyone has chosen — review + change */
          <div>
            <div className="rounded-md border border-accent-light bg-accent-light/15 px-4 py-3 mb-6">
              <p className="font-sans text-sm text-foreground">
                All set — everyone has a meal selected. Thank you!
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-accent-light/40 rounded-lg border border-accent-light/60">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  <div>
                    <p className="font-serif text-lg text-foreground">{m.name}</p>
                    <p className="font-sans text-sm text-muted">
                      {selections[m.id] ? MEAL_LABEL[selections[m.id]!] : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingId(m.id)}
                    className="text-sm font-sans text-accent hover:text-foreground transition-colors"
                  >
                    Change
                  </button>
                </li>
              ))}
            </ul>
            {status === "error" && (
              <p role="alert" className="mt-4 text-sm font-sans text-red-700">
                Something went wrong saving. Please try again.
              </p>
            )}
          </div>
        )}

        {confirming && (
          <div
            className="md:hidden fixed inset-0 z-50 flex items-center justify-center px-10 bg-black/20"
            role="status"
            aria-live="polite"
          >
            <div className="animate-pop-in rounded-2xl border border-accent-light/60 bg-background shadow-xl px-8 py-7 flex flex-col items-center text-center max-w-xs w-full">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white mb-4">
                <svg viewBox="0 0 20 20" className="w-7 h-7" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-muted mb-1">
                Saved
              </p>
              <p className="font-serif text-xl text-foreground">
                {confirming.name}
              </p>
              <p className="font-sans text-sm text-muted mt-1">
                {MEAL_LABEL[confirming.choice]}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================== DESKTOP: all at once ===================== */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-10">
          {members.map((member) => (
            <fieldset key={member.id}>
              <legend className="font-serif text-2xl text-foreground mb-4">
                {member.name}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MEAL_OPTIONS.map((option) => {
                  const selected = selections[member.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => choose(member.id, option.id)}
                      aria-pressed={selected}
                      disabled={locked}
                      className={`group text-left rounded-lg overflow-hidden border-2 transition-colors ${
                        locked ? "cursor-not-allowed" : ""
                      } ${
                        selected
                          ? "border-accent ring-2 ring-accent/30"
                          : `border-transparent ${locked ? "opacity-80" : "hover:border-accent-light"}`
                      }`}
                    >
                      <div className="relative w-full h-44 bg-accent-light/20">
                        <Image
                          src={option.image}
                          alt={option.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 320px"
                          className="object-cover"
                        />
                        {selected && <SelectedBadge />}
                      </div>
                      <div className="px-4 py-3 bg-white/50">
                        <p className="font-serif text-lg text-foreground">
                          {option.name}
                        </p>
                        <p className="font-sans text-sm text-muted mt-1">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {!locked && (
          <div className="mt-10 flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className="rounded-full bg-accent px-8 py-3 font-sans text-sm uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "saving" ? "Saving…" : "Save Selections"}
            </button>

            {status === "saved" && allChosen && (
              <span className="font-sans text-sm text-green-700">
                All set — thank you!
              </span>
            )}
            {status === "saved" && !allChosen && (
              <span className="font-sans text-sm text-muted">
                Saved. Everyone needs a selection to complete this step.
              </span>
            )}
            {status === "error" && (
              <span role="alert" className="font-sans text-sm text-red-700">
                Something went wrong. Please try again.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
