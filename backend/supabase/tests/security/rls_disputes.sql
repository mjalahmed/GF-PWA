-- Phase 10 disputes RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='disputes') then
    raise exception 'disputes missing';
  end if;
  if not exists (select 1 from pg_type where typname='dispute_status') then
    raise exception 'dispute_status missing';
  end if;
  if not exists (select 1 from public.permissions where code='dispute.create') then
    raise exception 'dispute permissions missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='disputes') then
    raise exception 'disputes RLS disabled';
  end if;
  if not exists (select 1 from storage.buckets where id='dispute-evidence') then
    raise exception 'dispute-evidence bucket missing';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='next_dispute_number'
  ) then
    raise exception 'next_dispute_number missing';
  end if;
end $$;
rollback;
