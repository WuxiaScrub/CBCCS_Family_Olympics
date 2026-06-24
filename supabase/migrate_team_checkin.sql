-- Run this once against an existing Supabase project to add event-day
-- check-in tracking to teams. Safe to run more than once.

alter table teams add column if not exists checked_in boolean not null default false;
