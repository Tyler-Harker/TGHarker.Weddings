-- Whether the party is attending. NULL until the guest answers; false = declined
-- (their guest list is removed and the dinner step is skipped).
ALTER TABLE parties ADD COLUMN IF NOT EXISTS attending BOOLEAN;
