import type { ScheduleEntry } from "@/lib/schedule";

export default function ScheduleList({ entries }: { entries: ScheduleEntry[] }) {
  return entries.length ? (
    <ol className="divide-y divide-accent-light/60 rounded-lg border border-accent-light/60 bg-white/40">
      {entries.map((entry, i) => (
        <li key={i} className="px-6 py-5 font-sans text-foreground break-words">
          {entry.thing} - {entry.time}
        </li>
      ))}
    </ol>
  ) : <p className="font-sans text-muted">Our wedding day schedule is coming soon. Please check back!</p>;
}
