# CBCCS Family Olympics

A scoring app for a church family Olympics event. Station leaders record each
team's score/time at their station; admins manage teams and stations and view
a results dashboard.

Each station/event is scored and won independently, but two values are
combined across stations into separate rankings: **overall points**, where
each station awards points by placement (1st = 5, 2nd = 3, 3rd = 1, rest = 0)
that are summed for an overall ranking, and **spirit points**, where every
station leader also records a spirit points value per team, summed across
stations into a separate Spirit Award.

This is a prototype: station leaders aren't gated behind any login — the
landing page just lets you pick "Station Leader" directly. Admin pages are
gated behind a single shared password (see Setup below); the password is
checked server-side via Supabase and never sent to the browser. Real
per-user auth can be layered on later using Supabase Auth without changing
the schema.

## Stack

- Plain HTML, CSS, and JavaScript — no build step, no framework
- Supabase (Postgres) for data storage, accessed directly from the browser via the `@supabase/supabase-js` CDN build
- A hand-rolled CSS bar chart for the admin leaderboard

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. It creates the `teams`, `team_members`, `stations`, and `scores` tables, plus `station_rankings` (per-station placement), `spirit_leaderboard` (total spirit points per team across all stations), and `overall_leaderboard` (points by placement, summed and ranked across all stations) views. If you already ran `schema.sql` on this project before the spirit points sections or overall ranking existed, run `supabase/migrate_spirit_sections.sql` and `supabase/migrate_overall_leaderboard.sql` once to bring it up to date. If you ran `migrate_overall_leaderboard.sql` before the events-participated tie breaker was dropped, also run `supabase/migrate_drop_events_tiebreak.sql`. If you already ran `schema.sql` before the optional team contact info field existed, run `supabase/migrate_add_contact_info.sql` once to add it.
3. Run `supabase/admin_auth.sql` too. It creates a locked-down `admin_auth` table (RLS enabled, no policies — unreachable via the REST API) and a `verify_admin_password()` function that the admin pages call via RPC; it only ever returns `true`/`false`, never the password itself.
4. Set your admin password by running this in the SQL editor (replace the placeholder — don't commit this statement anywhere):
   ```sql
   insert into admin_auth (id, password) values (1, 'your-password-here')
   on conflict (id) do update set password = excluded.password;
   ```
5. Edit `js/supabase-config.js` and fill in your project's URL and anon key (Project Settings → API in Supabase).
6. Open `index.html` directly in a browser, or serve the folder with any static file server.

## Using the app

- **Admin** (`admin.html`, `admin-teams.html`, `admin-stations.html`): prompts for the shared admin password (once per browser session), then lets you register teams and members, set up the 8 stations (each is either "points, higher wins" or "time, lower wins"), and view the Overall Ranking, the Spirit Award standings, and a per-station results breakdown (place, score/time, spirit points).
- **Station Leader** (`station.html`): pick your station, pick a team, enter their score/time and rate the team 1-5 on each spirit points section (Joy, Patience, Humility, Cheer) using the sliders; the total spirit points is the auto-calculated sum of the four. Selecting a team that already has an entry loads it for editing; re-submitting updates it.

## Deploying to GitHub Pages

No build step needed — this is a static site.

1. In the repo, go to **Settings → Pages** and set the source to "Deploy from a branch", with branch `main` and folder `/ (root)`.
2. Make sure `js/supabase-config.js` has your real Supabase URL/anon key committed (see Setup above) — there's no build-time secret injection in this stack, so the values in that file are what gets served.
3. Push to `main` and the site updates within a minute or two.

Note: the Supabase anon key is meant to be public-safe by design, but with the open Row Level Security policies in `schema.sql`, anyone with the deployed URL can currently read/write teams/stations/scores data without the admin password (the password only gates the admin *pages*, not the underlying tables). That's fine for a single-day private event link, but should be tightened (e.g. with real per-user logins and matching RLS policies) before reusing this for anything more sensitive.
