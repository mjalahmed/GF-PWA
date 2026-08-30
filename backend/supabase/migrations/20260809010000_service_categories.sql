-- Service categories (platform taxonomy)
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.service_categories (id) on delete set null,
  code text not null unique,
  name text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index service_categories_parent_id_idx on public.service_categories (parent_id);
create index service_categories_active_sort_idx on public.service_categories (is_active, sort_order);

create trigger service_categories_set_updated_at
  before update on public.service_categories
  for each row execute function public.set_updated_at();

insert into public.service_categories (code, name, description, sort_order) values
  ('maintenance', 'Maintenance', 'Routine maintenance services', 10),
  ('engine', 'Engine', 'Engine repair and service', 20),
  ('transmission', 'Transmission', 'Transmission service and repair', 30),
  ('brakes', 'Brakes', 'Brake system services', 40),
  ('suspension', 'Suspension', 'Suspension and steering', 50),
  ('electrical', 'Electrical', 'Electrical and battery systems', 60),
  ('air_conditioning', 'Air Conditioning', 'A/C diagnosis and repair', 70),
  ('diagnostics', 'Diagnostics', 'Computer diagnostics', 80),
  ('tyres', 'Tyres', 'Tyre fitting and balancing', 90),
  ('body_repair', 'Body Repair', 'Body and collision repair', 100),
  ('detailing', 'Detailing', 'Detailing and cosmetic care', 110),
  ('inspection', 'Inspection', 'Vehicle inspection', 120),
  ('towing', 'Towing', 'Towing and roadside assistance', 130),
  ('mobile_service', 'Mobile Service', 'On-site mobile services', 140),
  ('other', 'Other', 'Other services', 150)
on conflict (code) do nothing;
