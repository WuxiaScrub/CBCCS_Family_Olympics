-- Admin password gate. Run this once in the Supabase SQL editor (in addition
-- to schema.sql). It creates a single-row table that is completely locked
-- down from the REST API (RLS enabled, no policies), plus a function that
-- checks a candidate password against it and returns only true/false.
--
-- After running this file, set your actual password with a separate
-- statement (don't commit it to git):
--
--   insert into admin_auth (id, password) values (1, 'your-password-here')
--   on conflict (id) do update set password = excluded.password;

create table admin_auth (
  id int primary key default 1,
  password text not null,
  constraint admin_auth_single_row check (id = 1)
);

alter table admin_auth enable row level security;
-- Deliberately no policies: this makes the table unreadable/unwritable via
-- the anon/authenticated REST API. Only the function below (as owner) can
-- read it.

create or replace function verify_admin_password(input_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_auth where id = 1 and password = input_password
  );
$$;

grant execute on function verify_admin_password(text) to anon;
