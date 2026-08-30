-- Business categories for onboarding and business profiles
create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index business_categories_is_active_sort_idx
  on public.business_categories (is_active, sort_order);

create trigger business_categories_set_updated_at
  before update on public.business_categories
  for each row
  execute function public.set_updated_at();

insert into public.business_categories (code, name, description, sort_order) values
  ('garage', 'Garage', 'General automotive garage services', 10),
  ('mechanical_workshop', 'Mechanical Workshop', 'Mechanical repair and maintenance workshop', 20),
  ('body_shop', 'Body Shop', 'Collision repair and body work', 30),
  ('car_wash', 'Car Wash', 'Vehicle washing services', 40),
  ('detailing', 'Detailing', 'Vehicle detailing and cosmetic care', 50),
  ('tire_shop', 'Tire Shop', 'Tire sales and fitting', 60),
  ('spare_parts', 'Spare Parts', 'Automotive spare parts retailer', 70),
  ('towing', 'Towing', 'Vehicle towing and roadside assistance', 80),
  ('mobile_mechanic', 'Mobile Mechanic', 'On-site mobile mechanical services', 90),
  ('inspection_service', 'Inspection Service', 'Vehicle inspection and certification', 100),
  ('accessories_shop', 'Accessories Shop', 'Automotive accessories and add-ons', 110),
  ('other', 'Other', 'Other automotive-related business', 120);
