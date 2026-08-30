-- Vehicle makes and models (reference data)
create table public.vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.vehicle_makes (id) on delete cascade,
  name text not null,
  slug text not null,
  start_year integer,
  end_year integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (make_id, slug),
  constraint vehicle_models_year_range_check
    check (
      start_year is null
      or end_year is null
      or start_year <= end_year
    )
);

create index vehicle_models_make_id_idx on public.vehicle_models (make_id);

insert into public.vehicle_makes (name, slug) values
  ('Toyota', 'toyota'),
  ('Nissan', 'nissan'),
  ('Honda', 'honda'),
  ('Hyundai', 'hyundai'),
  ('Kia', 'kia'),
  ('Ford', 'ford'),
  ('Chevrolet', 'chevrolet'),
  ('Mitsubishi', 'mitsubishi'),
  ('Mazda', 'mazda'),
  ('Lexus', 'lexus'),
  ('BMW', 'bmw'),
  ('Mercedes-Benz', 'mercedes-benz'),
  ('Audi', 'audi'),
  ('Volkswagen', 'volkswagen'),
  ('Land Rover', 'land-rover'),
  ('Jeep', 'jeep')
on conflict (slug) do nothing;

insert into public.vehicle_models (make_id, name, slug, start_year)
select m.id, x.name, x.slug, x.start_year
from public.vehicle_makes m
join (
  values
    ('toyota', 'Camry', 'camry', 2015),
    ('toyota', 'Corolla', 'corolla', 2015),
    ('toyota', 'Land Cruiser', 'land-cruiser', 2010),
    ('toyota', 'Hilux', 'hilux', 2012),
    ('toyota', 'RAV4', 'rav4', 2015),
    ('nissan', 'Patrol', 'patrol', 2010),
    ('nissan', 'Altima', 'altima', 2015),
    ('nissan', 'X-Trail', 'x-trail', 2015),
    ('honda', 'Civic', 'civic', 2015),
    ('honda', 'Accord', 'accord', 2015),
    ('honda', 'CR-V', 'cr-v', 2015),
    ('hyundai', 'Tucson', 'tucson', 2015),
    ('hyundai', 'Elantra', 'elantra', 2015),
    ('hyundai', 'Santa Fe', 'santa-fe', 2015),
    ('kia', 'Sportage', 'sportage', 2015),
    ('kia', 'Sorento', 'sorento', 2015),
    ('ford', 'Explorer', 'explorer', 2015),
    ('ford', 'F-150', 'f-150', 2015),
    ('bmw', '3 Series', '3-series', 2015),
    ('bmw', 'X5', 'x5', 2015),
    ('mercedes-benz', 'C-Class', 'c-class', 2015),
    ('mercedes-benz', 'GLE', 'gle', 2015),
    ('lexus', 'RX', 'rx', 2015),
    ('lexus', 'ES', 'es', 2015)
) as x(make_slug, name, slug, start_year)
  on m.slug = x.make_slug
on conflict (make_id, slug) do nothing;
