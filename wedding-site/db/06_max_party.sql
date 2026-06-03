-- Maximum total party size (including the invited guest themselves).
-- Default 2 = everyone gets a +1; admins can adjust per guest.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS max_party_size INTEGER NOT NULL DEFAULT 2;
