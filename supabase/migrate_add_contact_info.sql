-- Run this once against an existing Supabase project to add an optional
-- contact info field (email/phone) to team registrations. Safe to run more
-- than once.

alter table teams add column if not exists contact_info text;
