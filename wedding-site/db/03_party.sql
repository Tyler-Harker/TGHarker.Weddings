-- A guest's RSVP party. One per invited contact (the person who logs in).
CREATE TABLE IF NOT EXISTS parties (
  id           SERIAL PRIMARY KEY,
  contact_id   INTEGER NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,            -- set once the "Your Party" step is completed
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members of a party, including the primary guest who logged in.
CREATE TABLE IF NOT EXISTS party_members (
  id          SERIAL PRIMARY KEY,
  party_id    INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  meal_choice TEXT CHECK (meal_choice IN ('fried_chicken', 'brisket')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS party_members_party_id_idx ON party_members (party_id);
