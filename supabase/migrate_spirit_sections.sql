-- Run this once against an existing Supabase project (one that already ran
-- schema.sql before the spirit points sections were added). Adds the four
-- 1-5 section ratings behind the spirit points sliders on the station leader
-- page. Existing spirit_points totals are left untouched; the new section
-- columns default to 1 for rows entered before this migration. Safe to run
-- more than once.

alter table scores add column if not exists joy_points numeric not null default 1 check (joy_points between 1 and 5);
alter table scores add column if not exists patience_points numeric not null default 1 check (patience_points between 1 and 5);
alter table scores add column if not exists humility_points numeric not null default 1 check (humility_points between 1 and 5);
alter table scores add column if not exists cheer_points numeric not null default 1 check (cheer_points between 1 and 5);
