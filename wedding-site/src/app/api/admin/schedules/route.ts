import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/session";
import { query } from "@/lib/db";
import { isSchedulePage, validateEntries } from "@/lib/schedule";

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const entries = validateEntries(body?.entries);
  if (!isSchedulePage(body?.page) || entries === null) {
    return NextResponse.json({ error: "Choose a page and provide an activity and time for every entry (up to 50)." }, { status: 400 });
  }
  await query(
    `INSERT INTO page_schedules (page, entries) VALUES ($1, $2::jsonb)
     ON CONFLICT (page) DO UPDATE SET entries = EXCLUDED.entries, updated_at = now()`,
    [body.page, JSON.stringify(entries)]
  );
  return NextResponse.json({ ok: true });
}
