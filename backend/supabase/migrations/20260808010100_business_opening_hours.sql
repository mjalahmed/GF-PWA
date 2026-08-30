-- Opening hours (business default and optional branch override)
create table public.business_opening_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid references public.business_branches (id) on delete cascade,
  day_of_week integer not null,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_opening_hours_day_check
    check (day_of_week >= 0 and day_of_week <= 6),
  constraint business_opening_hours_times_check
    check (
      (
        is_closed = true
        and opens_at is null
        and closes_at is null
      )
      or (
        is_closed = false
        and opens_at is not null
        and closes_at is not null
        and opens_at < closes_at
      )
    )
);

create unique index business_opening_hours_business_day_uidx
  on public.business_opening_hours (business_id, day_of_week)
  where branch_id is null;

create unique index business_opening_hours_branch_day_uidx
  on public.business_opening_hours (business_id, branch_id, day_of_week)
  where branch_id is not null;

create index business_opening_hours_business_id_idx
  on public.business_opening_hours (business_id);

create index business_opening_hours_branch_id_idx
  on public.business_opening_hours (branch_id);

create trigger business_opening_hours_set_updated_at
  before update on public.business_opening_hours
  for each row
  execute function public.set_updated_at();
