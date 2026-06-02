-- Guest contact list used to validate RSVP name lookups.
CREATE TABLE IF NOT EXISTS contacts (
  id          SERIAL PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  party_name  TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lookups are case-insensitive and trim surrounding whitespace, so enforce
-- uniqueness on the normalized (first, last) name pair.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_name_unique
  ON contacts (LOWER(TRIM(first_name)), LOWER(TRIM(last_name)));
