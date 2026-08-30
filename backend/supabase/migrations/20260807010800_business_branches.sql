-- Business branch locations
create table public.business_branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address_line text not null,
  area text,
  city text,
  country_code text not null default 'BH',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  timezone text not null default 'Asia/Bahrain',
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_branches_country_code_check
    check (char_length(country_code) = 2),
  constraint business_branches_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint business_branches_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create index business_branches_business_id_idx
  on public.business_branches (business_id);

create index business_branches_is_active_idx
  on public.business_branches (business_id, is_active);

create unique index business_branches_one_primary_active_uidx
  on public.business_branches (business_id)
  where is_primary = true and is_active = true;

create trigger business_branches_set_updated_at
  before update on public.business_branches
  for each row
  execute function public.set_updated_at();
