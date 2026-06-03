# Tyler & Kylie — Wedding Site

A [Next.js](https://nextjs.org) app for our wedding. Guests RSVP by looking up
their name against the invited-guest list; a successful lookup issues a signed
session cookie that unlocks their dashboard.

## Stack

- **Next.js 16** (App Router, standalone output) + React 19
- **PostgreSQL** for the guest contact list (`pg`)
- **JWT** session cookies signed with [`jose`](https://github.com/panva/jose)
- **Tailwind CSS v4**
- Deployed as a **Docker image** to our own infrastructure

## How RSVP works

1. The homepage has an **RSVP** call-to-action → `/rsvp`.
2. `/rsvp` asks for first + last name (as spelled on the invitation envelope).
3. `POST /api/rsvp/lookup` matches the name against `contacts`
   (case-insensitive, whitespace-trimmed).
   - **Match** → a signed JWT is set as an `httpOnly` cookie (`rsvp_session`)
     and the guest is sent to `/dashboard`.
   - **No match** → the form tells them to check for typos or contact Tyler/Kylie.
4. `src/proxy.ts` (Next.js request middleware) guards routes:
   - `/dashboard/*` requires a valid session, otherwise → `/rsvp`.
   - Authenticated guests visiting `/` or `/rsvp` are sent straight to `/dashboard`.

### Dashboard RSVP steps

The dashboard (mobile-responsive: left sidebar on desktop, hamburger drawer on
phones) walks each guest through completion-tracked steps that earn a green
checkmark when done:

1. **Attend** (`/dashboard/attend`) — Accept or Decline (`parties.attending`).
   First-time guests land here straight after login. Declining clears any guest
   list (`party_members` removed, `submitted_at` reset) and skips the remaining
   steps.
2. **Your Party** (`/dashboard/party`) — only for attendees; confirm whether
   they're bringing additional guests and name them (the primary guest is always
   included). Saving marks the guest step complete (`parties.submitted_at`).
3. **Dinner Choices** (`/dashboard/dinner`) — locked until Your Party is
   submitted (meals are per member). Each member picks Country Fried Chicken or
   Smoked Brisket. Complete once every member has a selection. On phones this is
   a one-guest-at-a-time stepper (only asking members who haven't chosen, saving
   each pick) with a review/change screen; desktop shows all members at once.

The overview shows an **RSVP progress bar** (Attend → Your Party → Dinner) whose
steps are clickable once unlocked. On phones it also appears on each step page.

Data lives in the `parties` and `party_members` tables (`db/03_party.sql`).
Meal options and their images are defined in `src/lib/meals.ts`
(images under `public/meals/`); add or change a meal there and in the
`meal_choice` CHECK constraint.

### Edit window

Guests can edit their party and meals until **30 days before the wedding**
(Oct 22, 2026). The cutoff lives in `src/lib/event.ts` (`RSVP_EDIT_DAYS_BEFORE`)
and is enforced both in the UI (forms lock, a notice explains the deadline) and
server-side in the API routes (writes return `403 rsvp_closed` after the
deadline). Guests can still log in to view their selections after it closes.

### Admin (`/admin`)

A simple admin view at `/admin` (login at `/admin/login`) shows:

- **Guest List** management — add guests (name, optional household + email) and
  remove them inline. Removing a contact cascades to their RSVP party and meal
  selections. This is how you populate a fresh production invite list.
- **Max party size** per guest (`contacts.max_party_size`, default 2 =
  themselves + 1), editable with the ± control in the table. The party step
  enforces it (server + UI); exceeding it shows the guest a "venue constraints"
  modal pointing them to Tyler/Kylie.
- **Guest Progress** across the whole invite list — who has **signed in** (and
  when) vs. not, plus per-stage completion (Your Party, Dinner) for each contact.
- **All Guests** — every party member (incl. plus-ones), which RSVP added them,
  and their meal.
- Summary counts and a meal-choice breakdown.
- **QR Code generator** — type any path and download a PNG QR code pointing to it
  on the current domain (e.g. for invitations linking to `/rsvp`). The domain is
  read from the browser, so generate it from the production URL.

Sign-in is recorded on the name lookup (`contacts.last_signed_in_at`,
`db/04_signin.sql`). Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(default `test@test.com` / `password` — change for production). Admin auth uses
a separate `admin_session` cookie, guarded by `src/proxy.ts`.

## Local development

Requires Node 20+ and Docker.

```bash
# 1. Start Postgres
docker compose up -d db
# The app applies db/*.sql schema migrations automatically on startup (see
# "Migrations" below), so you don't need to apply new migration files by hand.
# The compose container also runs db/*.sql (incl. the seed) when the volume is
# first created, which is what gives local dev its sample contacts.

# 2. Configure environment
cp .env.example .env.local

# 3. Install deps and run the dev server
npm install
npm run dev
```

Open http://localhost:3000. Seeded test guests include **Tyler Harker** and
**Kylie Flatt** (see `db/02_seed.sql`).

## Environment variables

| Variable         | Description                                                |
| ---------------- | --------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string.                             |
| `JWT_SECRET`     | Secret for signing session JWTs. `openssl rand -base64 32` |
| `ADMIN_EMAIL`    | Admin login email for `/admin` (default `test@test.com`). |
| `ADMIN_PASSWORD` | Admin login password for `/admin` (default `password`).   |

## Migrations

Schema migrations live in `db/*.sql` and are **applied automatically on server
startup** via the Next.js instrumentation hook (`src/instrumentation.ts` →
`src/lib/migrate.ts`). They run in filename order, are idempotent
(`CREATE/ALTER ... IF NOT EXISTS`), are guarded by a Postgres advisory lock (safe
with multiple replicas), and **skip any `*seed*` file** so production never gets
sample data. The `db/` folder is copied into the Docker image for this.

To add a migration, drop a new numbered file in `db/` (e.g. `db/06_xyz.sql`) —
it applies on the next boot. On startup the server also logs which env vars are
set (never their values); a `MISSING` there explains 500s:

```
[startup] env — DATABASE_URL: set | JWT_SECRET: set | ADMIN_EMAIL: default(test@test.com)
[migrate] applied 01_schema.sql
...
```

> New production databases start empty — after the first deploy, **insert your
> real contact list** (the seed is dev-only). See below.

## The guest contact list

The `contacts` table is the source of truth for who may RSVP. For local dev it's
seeded from `db/02_seed.sql`. To add real guests, insert rows, e.g.:

```sql
INSERT INTO contacts (first_name, last_name, party_name)
VALUES ('First', 'Last', 'Household name');
```

Names are matched case-insensitively and trimmed, and the
`contacts_name_unique` index enforces one row per (first, last) name pair.

## Deployment (Docker)

The app builds to a self-contained server (`output: "standalone"`).

```bash
# Build the image
docker build -t wedding-site .

# Run it (provide your own DATABASE_URL + JWT_SECRET)
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e JWT_SECRET="<strong-secret>" \
  wedding-site
```

`docker compose up --build` runs the full stack (app + Postgres) for a
production-like check. CI (`.github/workflows/ci.yml`) lints, builds, and
validates the Docker image on every push; wire up the registry push + deploy
step for our infrastructure there.

> **Note:** the site is no longer a static GitHub Pages export — the RSVP
> endpoint, Postgres, and session cookies require a running Node server.
