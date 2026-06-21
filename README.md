# CBCCS Family Olympics

A scoring app for a church family Olympics event. Station leaders record each
team's score/time at their station; admins manage teams and stations and view
a results dashboard.

This is a prototype: there is no login yet — the landing page just lets you
pick "Station Leader" or "Admin" mode directly. Real auth can be layered on
later using Supabase Auth + Row Level Security without changing the schema.

## Stack

- React + Vite + TypeScript, deployed as a static site to GitHub Pages
- Supabase (Postgres) for data storage, accessed directly from the browser via `@supabase/supabase-js`
- Recharts for the admin leaderboard chart

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. It creates the `teams`, `team_members`, `stations`, and `scores` tables plus `station_points` and `leaderboard` views that compute placement (1st/2nd/3rd) and award points (5/3/1/0) automatically.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and anon key (Project Settings → API in Supabase):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Install dependencies and run the dev server:
   ```
   npm install
   npm run dev
   ```

## Using the app

- **Admin** (`/admin`): register teams and members, set up the 8 stations (each is either "points, higher wins" or "time, lower wins"), and view the live leaderboard with a bar chart and a per-station breakdown.
- **Station Leader** (`/station`): pick your station, pick a team, enter their score or time. Submitting again for the same team updates their existing entry.

Placement points (5 / 3 / 1 / 0 for 1st–3rd and the rest) are computed automatically by the `leaderboard` SQL view based on each station's scoring direction — no manual tallying needed.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and publishes the app on every push to `main`.

1. In the repo, go to **Settings → Pages** and set the source to "GitHub Actions".
2. Add two repository secrets (**Settings → Secrets and variables → Actions**): `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are baked into the static build at build time.
3. Push to `main` and the workflow will deploy automatically.

Note: the Supabase anon key is meant to be public-safe by design, but with the open Row Level Security policies in `schema.sql`, anyone with the deployed URL can currently read/write data. That's fine for a single-day private event link, but should be tightened (e.g. with real station leader/admin logins) before reusing this for anything more sensitive.
