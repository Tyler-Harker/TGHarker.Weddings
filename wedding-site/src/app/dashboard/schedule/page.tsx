import ScheduleList from "@/app/components/schedule-list";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSchedule } from "@/lib/schedule-data";

export default async function SchedulePage() {
  if (!(await getSession())) redirect("/rsvp");
  const entries = await getSchedule("schedule");
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted font-sans mb-3">The Wedding Day</p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">Schedule</h1>
      <p className="font-sans text-muted mb-8">November 21, 2026</p>
      <ScheduleList entries={entries} />
    </div>
  );
}
