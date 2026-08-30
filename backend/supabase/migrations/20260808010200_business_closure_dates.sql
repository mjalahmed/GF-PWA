-- One-off closure dates (full day or partial)
create table public.business_closure_dates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid references public.business_branches (id) on delete cascade,
  closure_date date not null,
  reason text,
  is_full_day boolean not null default true,
  opens_at time,
  closes_at time,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_closure_dates_times_check
    check (
      (
        is_full_day = true
        and opens_at is null
        and closes_at is null
      )
      or (
        is_full_day = false
        and opens_at is not null
        and closes_at is not null
        and opens_at < closes_at
      )
    )
);

create unique index business_closure_dates_business_day_uidx
  on public.business_closure_dates (business_id, closure_date)
  where branch_id is null;

create unique index business_closure_dates_branch_day_uidx
  on public.business_closure_dates (business_id, branch_id, closure_date)
  where branch_id is not null;

create index business_closure_dates_business_id_idx
  on public.business_closure_dates (business_id);

create index business_closure_dates_date_idx
  on public.business_closure_dates (closure_date);

create trigger business_closure_dates_set_updated_at
  before update on public.business_closure_dates
  for each row
  execute function public.set_updated_at();
