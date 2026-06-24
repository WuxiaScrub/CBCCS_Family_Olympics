-- CBCCS Family Olympics schema
-- Run this in the Supabase SQL editor on a fresh project.

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null
);

create table stations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  scoring_type text not null check (scoring_type in ('points', 'time')),
  -- 'asc' = lower value wins (e.g. race time), 'desc' = higher value wins (e.g. points)
  direction text not null check (direction in ('asc', 'desc')),
  created_at timestamptz not null default now()
);

-- Each event/station is scored independently of the others (no combined
-- overall score). Spirit points are the one exception: every station leader
-- also records a spirit point value per team, and those are summed across
-- all stations for a separate Spirit Award.
create table scores (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  value numeric not null,
  -- Spirit points are entered as four 1-5 ratings; spirit_points is their sum
  -- and is what feeds the Spirit Award leaderboard (station_rankings/spirit_leaderboard
  -- below only ever look at spirit_points, not the individual sections).
  joy_points numeric not null default 1 check (joy_points between 1 and 5),
  patience_points numeric not null default 1 check (patience_points between 1 and 5),
  humility_points numeric not null default 1 check (humility_points between 1 and 5),
  cheer_points numeric not null default 1 check (cheer_points between 1 and 5),
  spirit_points numeric not null default 0,
  recorded_by text,
  recorded_at timestamptz not null default now(),
  unique (station_id, team_id)
);

-- Per-station placement, for display only (e.g. "Team X won the sack race").
-- This does not feed into any overall/combined score.
create or replace view station_rankings as
select
  s.id as score_id,
  s.station_id,
  s.team_id,
  s.value,
  s.spirit_points,
  rank() over (
    partition by s.station_id
    order by case when st.direction = 'asc' then s.value else -s.value end
  ) as place
from scores s
join stations st on st.id = s.station_id;

-- Spirit Award: total spirit points per team, summed across every station.
create or replace view spirit_leaderboard as
select
  t.id as team_id,
  t.name as team_name,
  coalesce(sum(s.spirit_points), 0) as total_spirit_points
from teams t
left join scores s on s.team_id = t.id
group by t.id, t.name
order by total_spirit_points desc;

-- No auth yet, so RLS is left open for anon read/write. Tighten this once
-- station leader / admin logins are added.
alter table teams enable row level security;
alter table team_members enable row level security;
alter table stations enable row level security;
alter table scores enable row level security;

create policy "anon full access" on teams for all using (true) with check (true);
create policy "anon full access" on team_members for all using (true) with check (true);
create policy "anon full access" on stations for all using (true) with check (true);
create policy "anon full access" on scores for all using (true) with check (true);
