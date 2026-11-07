import { query } from "@/lib/db";
import type { ScheduleEntry, SchedulePage } from "./schedule";

export async function getSchedules(): Promise<Partial<Record<SchedulePage, ScheduleEntry[]>>> {
  const { rows } = await query<{ page: SchedulePage; entries: ScheduleEntry[] }>(
    "SELECT page, entries FROM page_schedules"
  );
  return Object.fromEntries(rows.map(({ page, entries }) => [page, entries]));
}

export async function getSchedule(page: SchedulePage): Promise<ScheduleEntry[]> {
  const { rows } = await query<{ entries: ScheduleEntry[] }>(
    "SELECT entries FROM page_schedules WHERE page = $1", [page]
  );
  return rows[0]?.entries ?? [];
}
