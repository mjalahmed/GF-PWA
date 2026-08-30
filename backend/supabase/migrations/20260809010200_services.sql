-- Business services catalog
create type public.service_pricing_type as enum (
  'fixed',
  'starting_from',
  'range',
  'quote_required',
  'free'
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid references public.business_branches (id) on delete set null,
  category_id uuid not null references public.service_categories (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  pricing_type public.service_pricing_type not null,
  price numeric(12, 3),
  minimum_price numeric(12, 3),
  maximum_price numeric(12, 3),
  estimated_duration_minutes integer,
  requires_appointment boolean not null default true,
  requires_vehicle boolean not null default true,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, slug),
  constraint services_price_nonneg_check
    check (
      coalesce(price, 0) >= 0
      and coalesce(minimum_price, 0) >= 0
      and coalesce(maximum_price, 0) >= 0
    ),
  constraint services_duration_nonneg_check
    check (estimated_duration_minutes is null or estimated_duration_minutes >= 0),
  constraint services_pricing_shape_check
    check (
      (
        pricing_type = 'fixed'
        and price is not null
      )
      or (
        pricing_type = 'starting_from'
        and minimum_price is not null
      )
      or (
        pricing_type = 'range'
        and minimum_price is not null
        and maximum_price is not null
        and minimum_price <= maximum_price
      )
      or (
        pricing_type = 'quote_required'
      )
      or (
        pricing_type = 'free'
        and coalesce(price, 0) = 0
      )
    )
);

create index services_business_id_idx on public.services (business_id);
create index services_category_id_idx on public.services (category_id);
create index services_branch_id_idx on public.services (branch_id);
create index services_business_active_idx on public.services (business_id, is_active);
create index services_name_lower_idx on public.services (lower(name));

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();
