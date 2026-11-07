-- Each page has an independently editable, ordered schedule.
CREATE TABLE IF NOT EXISTS page_schedules (
  page TEXT PRIMARY KEY CHECK (page IN ('schedule')),
  entries JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(entries) = 'array'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
