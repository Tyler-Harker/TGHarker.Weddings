"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleEntry } from "@/lib/schedule";

export default function ScheduleEditor({ initialEntries }: { initialEntries: ScheduleEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const button = "rounded border border-accent-light px-3 py-2 text-sm hover:border-accent disabled:opacity-40";

  function update(index: number, field: keyof ScheduleEntry, value: string) {
    setMessage("");
    setEntries(entries.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }

  function move(index: number, direction: number) {
    const next = [...entries];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setEntries(next);
    setMessage("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: "schedule", entries }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not save schedule.");
      }
      setMessage("Schedule saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save schedule. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-foreground mb-2">Wedding Schedule</h2>
      <p className="font-sans text-sm text-muted mb-4">
        Guests see these entries on their Schedule page and at the bottom of the homepage, in the order below. For example: Ceremony - 4:00 PM.
      </p>
      <form onSubmit={save} className="font-sans">
        <fieldset disabled={busy} className="space-y-4">
          {entries.map((entry, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-accent-light/60 p-4">
              <label className="flex-1 min-w-40 text-sm">Activity
                <input required maxLength={200} value={entry.thing} onChange={event => update(i, "thing", event.target.value)} placeholder="Ceremony" className="mt-1 w-full rounded border border-accent-light bg-white/60 p-2" />
              </label>
              <label className="flex-1 min-w-40 text-sm">Time
                <input required maxLength={100} value={entry.time} onChange={event => update(i, "time", event.target.value)} placeholder="4:00 PM" className="mt-1 w-full rounded border border-accent-light bg-white/60 p-2" />
              </label>
              <button type="button" className={button} disabled={i === 0} aria-label={`Move entry ${i + 1} up`} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className={button} disabled={i === entries.length - 1} aria-label={`Move entry ${i + 1} down`} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className={button} aria-label={`Remove entry ${i + 1}`} onClick={() => { setEntries(entries.filter((_, index) => index !== i)); setMessage(""); }}>Remove</button>
            </div>
          ))}
          {!entries.length && <p className="text-sm text-muted">No entries. Guests will see a coming soon message.</p>}
          <div className="flex gap-3">
            <button type="button" className={button} disabled={entries.length >= 50} onClick={() => { setEntries([...entries, { thing: "", time: "" }]); setMessage(""); }}>Add entry</button>
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white disabled:opacity-40">{busy ? "Saving…" : "Save schedule"}</button>
          </div>
        </fieldset>
        <p role="status" className="mt-3 text-sm text-muted">{message}</p>
      </form>
    </section>
  );
}
