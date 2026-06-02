// Single source of truth for the wedding date and the RSVP edit window.
// Pure module (no server-only imports) so client and server agree.

// Use an explicit UTC instant so the formatted deadline label is identical on
// the server and in every guest's browser (no timezone drift by a day).
export const WEDDING_DATE = new Date("2026-11-21T00:00:00Z");

// Guests can edit their RSVP details until this many days before the wedding.
export const RSVP_EDIT_DAYS_BEFORE = 30;

export const RSVP_DEADLINE = new Date(
  WEDDING_DATE.getTime() - RSVP_EDIT_DAYS_BEFORE * 24 * 60 * 60 * 1000
);

// Editing is allowed up until the deadline instant.
export function isRsvpOpen(now: Date = new Date()): boolean {
  return now.getTime() < RSVP_DEADLINE.getTime();
}

export const RSVP_DEADLINE_LABEL = RSVP_DEADLINE.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
