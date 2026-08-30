-- Append-only application review history
create table public.business_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  previous_status text,
  new_status text,
  reason text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index business_application_reviews_application_id_idx
  on public.business_application_reviews (application_id, created_at);

create index business_application_reviews_reviewer_user_id_idx
  on public.business_application_reviews (reviewer_user_id);

create or replace function public.prevent_business_application_reviews_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    raise exception 'PERMISSION_DENIED: business_application_reviews is append-only'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger business_application_reviews_prevent_update
  before update on public.business_application_reviews
  for each row
  execute function public.prevent_business_application_reviews_mutation();

create trigger business_application_reviews_prevent_delete
  before delete on public.business_application_reviews
  for each row
  execute function public.prevent_business_application_reviews_mutation();

revoke update, delete on public.business_application_reviews from authenticated;
