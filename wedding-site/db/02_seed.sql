-- Sample guests for local development. Replace with the real contact list.
INSERT INTO contacts (first_name, last_name, party_name) VALUES
  ('Tyler', 'Harker', 'The Couple'),
  ('Kylie', 'Flatt', 'The Couple'),
  ('John', 'Smith', 'The Smith Family'),
  ('Jane', 'Doe', 'The Doe Household')
ON CONFLICT DO NOTHING;
