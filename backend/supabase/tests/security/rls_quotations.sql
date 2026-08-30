-- Phase 7 quotations RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='quotations') then
    raise exception 'quotations missing';
  end if;
  if not exists (select 1 from pg_type where typname='quotation_status') then
    raise exception 'quotation_status enum missing';
  end if;
  if not exists (select 1 from public.permissions where code='business.quotation.create') then
    raise exception 'quotation permissions missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='quotations') then
    raise exception 'quotations RLS disabled';
  end if;
end $$;
rollback;
