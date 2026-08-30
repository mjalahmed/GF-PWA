-- Phase 9 reviews RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='review_eligibilities') then
    raise exception 'review_eligibilities missing';
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='reviews') then
    raise exception 'reviews missing';
  end if;
  if not exists (select 1 from pg_type where typname='review_verification_type') then
    raise exception 'review_verification_type missing';
  end if;
  if not exists (select 1 from public.permissions where code='review.create') then
    raise exception 'review permissions missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='reviews') then
    raise exception 'reviews RLS disabled';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='review_eligibilities') then
    raise exception 'review_eligibilities RLS disabled';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='ensure_review_eligibility'
  ) then
    raise exception 'ensure_review_eligibility missing';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_verified_review'
  ) then
    raise exception 'create_verified_review missing';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='recalculate_business_rating'
  ) then
    raise exception 'recalculate_business_rating missing';
  end if;
end $$;
rollback;
