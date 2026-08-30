-- Business onboarding RLS smoke checks
begin;

do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'business_applications'
      and c.relrowsecurity
  ) then
    raise exception 'RLS not enabled on business_applications';
  end if;

  if not exists (
    select 1 from storage.buckets where id = 'business-application-documents'
  ) then
    raise exception 'business-application-documents bucket missing';
  end if;

  if to_regprocedure('public.approve_business_application(uuid,uuid,text)') is null then
    raise exception 'approve_business_application function missing';
  end if;
end $$;

rollback;
