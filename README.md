# CBCCS Family Olympics

A scoring app for a church family Olympics event. Station leaders record each
team's score/time at their station; admins manage teams and stations and view
a results dashboard.

Each station/event is scored and won independently — there is no combined
overall score. The one exception is **spirit points**: every station leader
also records a spirit points value per team, and those are summed across all
stations into a separate Spirit Award.

This is a prototype: there is no login yet — the landing page just lets you
pick "Station Leader" or "Admin" mode directly. Real auth can be layered on
later using Supabase Auth + Row Level Security without changing the schema.

## Stack

- Plain HTML, CSS, and JavaScript — no build step, no framework
- Supabase (Postgres) for data storage, accessed directly from the browser via the `@supabase/supabase-js` CDN build
- A hand-rolled CSS bar chart for the admin leaderboard

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. It creates the `teams`, `team_members`, `stations`, and `scores` tables, plus `station_rankings` (per-station placement, for display only) and `spirit_leaderboard` (total spirit points per team across all stations) views.
3. Edit `js/supabase-config.js` and fill in your project's URL and anon key (Project Settings → API in Supabase).
4. Open `index.html` directly in a browser, or serve the folder with any static file server.

## Using the app

- **Admin** (`admin.html`): register teams and members, set up the 8 stations (each is either "points, higher wins" or "time, lower wins"), and view the Spirit Award standings plus a per-station results breakdown (place, score/time, spirit points — informational only, not combined into an overall winner).
- **Station Leader** (`station.html`): pick your station, pick a team, enter their score/time and a spirit points value. Selecting a team that already has an entry loads it for editing; re-submitting updates it.

## Deploying to GitHub Pages

No build step needed — this is a static site.

1. In the repo, go to **Settings → Pages** and set the source to "Deploy from a branch", with branch `main` and folder `/ (root)`.
2. Make sure `js/supabase-config.js` has your real Supabase URL/anon key committed (see Setup above) — there's no build-time secret injection in this stack, so the values in that file are what gets served.
3. Push to `main` and the site updates within a minute or two.

Note: the Supabase anon key is meant to be public-safe by design, but with the open Row Level Security policies in `schema.sql`, anyone with the deployed URL can currently read/write data. That's fine for a single-day private event link, but should be tightened (e.g. with real station leader/admin logins) before reusing this for anything more sensitive.
