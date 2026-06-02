import { RSVP_DEADLINE_LABEL } from "@/lib/event";

// Presentational only (no hooks / server-only imports) so it can be used from
// both server components (overview) and client components (the forms).
export default function DeadlineNotice({ open }: { open: boolean }) {
  if (open) {
    return (
      <div className="rounded-md border border-accent-light/60 bg-accent-light/10 px-4 py-3 font-sans text-sm text-muted">
        You can update your RSVP until{" "}
        <span className="text-foreground font-medium">{RSVP_DEADLINE_LABEL}</span>
        {" "}— 30 days before the wedding.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-accent-light bg-accent-light/25 px-4 py-3 font-sans text-sm text-foreground">
      RSVP changes closed on{" "}
      <span className="font-medium">{RSVP_DEADLINE_LABEL}</span> (30 days before
      the wedding). Your selections are shown below — need a change? Please
      contact Tyler or Kylie directly.
    </div>
  );
}
