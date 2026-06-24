-- Run this once against an existing Supabase project to drop "events
-- participated" from the overall ranking tie breaker. Safe to run more
-- than once (it's just a view, no table changes).

create or replace view overall_leaderboard as
with team_points as (
  select
    sr.team_id,
    sum(case sr.place when 1 then 5 when 2 then 3 when 3 then 1 else 0 end) as total_points,
    count(distinct sr.station_id) as events_participated,
    count(*) filter (where sr.place = 1) as first_place_count,
    count(*) filter (where sr.place = 2) as second_place_count,
    count(*) filter (where sr.place = 3) as third_place_count
  from station_rankings sr
  group by sr.team_id
)
select
  t.id as team_id,
  t.name as team_name,
  coalesce(tp.total_points, 0) as total_points,
  coalesce(tp.events_participated, 0) as events_participated,
  coalesce(tp.first_place_count, 0) as first_place_count,
  coalesce(tp.second_place_count, 0) as second_place_count,
  coalesce(tp.third_place_count, 0) as third_place_count,
  rank() over (
    order by
      coalesce(tp.total_points, 0) desc,
      coalesce(tp.first_place_count, 0) desc,
      coalesce(tp.second_place_count, 0) desc,
      coalesce(tp.third_place_count, 0) desc
  ) as overall_rank
from teams t
left join team_points tp on tp.team_id = t.id;
