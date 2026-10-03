-- Phase 3 business-management RLS smoke checks
begin;

do $$
begin
  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'business_settings'
  ) then
    raise exception 'business_settings missing';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'business_opening_hours'
  ) then
    raise exception 'business_opening_hours missing';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'business_closure_dates'
  ) then
    raise exception 'business_closure_dates missing';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'business_invitations'
  ) then
    raise exception 'business_invitations missing';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'make_business_branch_primary'
  ) then
    raise exception 'make_business_branch_primary missing';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'accept_business_invitation'
  ) then
    raise exception 'accept_business_invitation missing';
  end if;

  if not exists (
    select 1 from public.permissions where code = 'business.member.invite'
  ) then
    raise exception 'business.member.invite permission missing';
  end if;

  if not exists (
    select 1 from public.permissions where code = 'business.audit.read'
  ) then
    raise exception 'business.audit.read permission missing';
  end if;

  if exists (
    select 1
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions p on p.id = rp.permission_id
    where r.code = 'business_manager'
      and p.code = 'business.schedule.update'
  ) then
    raise exception 'managers must not hold business.schedule.update';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'audit_logs'
      and column_name = 'business_id'
  ) then
    raise exception 'audit_logs.business_id missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'temporarily_closed'
  ) then
    raise exception 'businesses.temporarily_closed missing';
  end if;

  if not exists (
    select 1 from storage.buckets where id = 'business-media'
  ) then
    raise exception 'business-media bucket missing';
  end if;

  if not (
    select relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'business_settings'
  ) then
    raise exception 'business_settings RLS not enabled';
  end if;

  if not (
    select relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'business_invitations'
  ) then
    raise exception 'business_invitations RLS not enabled';
  end if;
end
$$;

rollback;
