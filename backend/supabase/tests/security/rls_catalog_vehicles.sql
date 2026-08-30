-- Phase 4 catalog/vehicle RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='services') then
    raise exception 'services missing';
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='products') then
    raise exception 'products missing';
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='vehicles') then
    raise exception 'vehicles missing';
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='favorites') then
    raise exception 'favorites missing';
  end if;
  if not exists (select 1 from storage.buckets where id='service-images') then
    raise exception 'service-images bucket missing';
  end if;
  if not exists (select 1 from public.permissions where code='business.service.create') then
    raise exception 'catalog permissions missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='services') then
    raise exception 'services RLS disabled';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='vehicles') then
    raise exception 'vehicles RLS disabled';
  end if;
end $$;
rollback;
