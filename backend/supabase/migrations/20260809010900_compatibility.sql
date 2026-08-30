-- Service and product vehicle compatibility
create type public.compatibility_type as enum (
  'all_vehicles',
  'make',
  'model',
  'year_range'
);

create table public.service_vehicle_compatibility (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  compatibility_type public.compatibility_type not null,
  make_id uuid references public.vehicle_makes (id) on delete cascade,
  model_id uuid references public.vehicle_models (id) on delete cascade,
  minimum_year integer,
  maximum_year integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint service_compat_fields_check
    check (
      (
        compatibility_type = 'all_vehicles'
        and make_id is null and model_id is null
        and minimum_year is null and maximum_year is null
      )
      or (
        compatibility_type = 'make'
        and make_id is not null and model_id is null
      )
      or (
        compatibility_type = 'model'
        and make_id is not null and model_id is not null
      )
      or (
        compatibility_type = 'year_range'
        and make_id is not null
        and minimum_year is not null
        and maximum_year is not null
        and minimum_year <= maximum_year
      )
    )
);

create index service_vehicle_compatibility_service_id_idx
  on public.service_vehicle_compatibility (service_id);

create table public.product_vehicle_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  compatibility_type public.compatibility_type not null,
  make_id uuid references public.vehicle_makes (id) on delete cascade,
  model_id uuid references public.vehicle_models (id) on delete cascade,
  minimum_year integer,
  maximum_year integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_compat_fields_check
    check (
      (
        compatibility_type = 'all_vehicles'
        and make_id is null and model_id is null
        and minimum_year is null and maximum_year is null
      )
      or (
        compatibility_type = 'make'
        and make_id is not null and model_id is null
      )
      or (
        compatibility_type = 'model'
        and make_id is not null and model_id is not null
      )
      or (
        compatibility_type = 'year_range'
        and make_id is not null
        and minimum_year is not null
        and maximum_year is not null
        and minimum_year <= maximum_year
      )
    )
);

create index product_vehicle_compatibility_product_id_idx
  on public.product_vehicle_compatibility (product_id);
