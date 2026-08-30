-- Product categories (platform taxonomy)
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories (id) on delete set null,
  code text not null unique,
  name text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index product_categories_parent_id_idx on public.product_categories (parent_id);
create index product_categories_active_sort_idx on public.product_categories (is_active, sort_order);

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

insert into public.product_categories (code, name, description, sort_order) values
  ('engine_oil', 'Engine Oil', 'Engine oils and lubricants', 10),
  ('filters', 'Filters', 'Oil, air, cabin, and fuel filters', 20),
  ('brakes', 'Brakes', 'Brake pads, discs, and fluid', 30),
  ('batteries', 'Batteries', 'Automotive batteries', 40),
  ('tyres', 'Tyres', 'Tyres and wheels', 50),
  ('spark_plugs', 'Spark Plugs', 'Spark plugs and ignition parts', 60),
  ('cooling', 'Cooling', 'Coolant and cooling system parts', 70),
  ('wipers', 'Wipers', 'Wiper blades and washers', 80),
  ('lighting', 'Lighting', 'Bulbs and lighting', 90),
  ('cleaning', 'Cleaning', 'Car care and cleaning products', 100),
  ('accessories', 'Accessories', 'Interior and exterior accessories', 110),
  ('tools', 'Tools', 'Tools and equipment', 120),
  ('other', 'Other', 'Other products', 130)
on conflict (code) do nothing;
