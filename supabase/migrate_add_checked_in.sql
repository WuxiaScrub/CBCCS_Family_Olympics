-- Run this once against an existing Supabase project to add day-of check-in
-- tracking for teams. Safe to run more than once.

alter table teams add column if not exists checked_in boolean not null default false;
