export const SCHEDULE_PAGES = { schedule: "Schedule" } as const;

export type SchedulePage = keyof typeof SCHEDULE_PAGES;
export interface ScheduleEntry {
  thing: string;
  time: string;
}

export function isSchedulePage(value: unknown): value is SchedulePage {
  return typeof value === "string" && Object.hasOwn(SCHEDULE_PAGES, value);
}

export function validateEntries(value: unknown): ScheduleEntry[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const entries: ScheduleEntry[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || typeof row.thing !== "string" || typeof row.time !== "string") return null;
    const thing = row.thing.trim();
    const time = row.time.trim();
    if (!thing || !time || thing.length > 200 || time.length > 100) return null;
    entries.push({ thing, time });
  }
  return entries;
}
