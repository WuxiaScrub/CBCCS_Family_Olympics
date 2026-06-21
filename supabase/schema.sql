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

create table scores (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  value numeric not null,
  recorded_by text,
  recorded_at timestamptz not null default now(),
  unique (station_id, team_id)
);

-- Per-station ranking of the latest score for each team, with placement points
-- awarded: 1st = 5, 2nd = 3, 3rd = 1, everyone else = 0.
create or replace view station_points as
select
  s.id as score_id,
  s.station_id,
  s.team_id,
  s.value,
  rank() over (
    partition by s.station_id
    order by case when st.direction = 'asc' then s.value else -s.value end
  ) as place,
  case rank() over (
    partition by s.station_id
    order by case when st.direction = 'asc' then s.value else -s.value end
  )
    when 1 then 5
    when 2 then 3
    when 3 then 1
    else 0
  end as points
from scores s
join stations st on st.id = s.station_id;

-- Total points per team across all stations.
create or replace view leaderboard as
select
  t.id as team_id,
  t.name as team_name,
  coalesce(sum(sp.points), 0) as total_points
from teams t
left join station_points sp on sp.team_id = t.id
group by t.id, t.name
order by total_points desc;

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
