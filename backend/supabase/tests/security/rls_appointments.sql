-- Phase 6 appointments RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='appointments') then
    raise exception 'appointments missing';
  end if;
  if not exists (select 1 from pg_type where typname='appointment_status') then
    raise exception 'appointment_status enum missing';
  end if;
  if not exists (select 1 from public.permissions where code='appointment.create') then
    raise exception 'appointment permissions missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='appointments') then
    raise exception 'appointments RLS disabled';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='appointment_services') then
    raise exception 'appointment_services RLS disabled';
  end if;
end $$;
rollback;
