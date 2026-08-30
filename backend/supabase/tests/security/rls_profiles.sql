-- RLS smoke checks (run after db reset with psql against local DB)
-- Example: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/security/rls_profiles.sql

begin;

-- Ensure foundation tables have RLS enabled
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles' and c.relrowsecurity
  ) then
    raise exception 'RLS not enabled on profiles';
  end if;
end $$;

-- Idempotency table should not grant insert to authenticated
do $$
declare
  has_insert boolean;
begin
  select exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'idempotency_records'
      and grantee = 'authenticated'
      and privilege_type = 'INSERT'
  ) into has_insert;

  if has_insert then
    raise exception 'authenticated must not insert idempotency_records';
  end if;
end $$;

rollback;
