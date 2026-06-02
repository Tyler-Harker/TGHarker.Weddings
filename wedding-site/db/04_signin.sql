-- Track when a contact last authenticated via the RSVP name lookup, so the
-- admin can see who has signed in and who has not.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_signed_in_at TIMESTAMPTZ;
