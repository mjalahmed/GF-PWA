-- Customer favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, business_id)
);

create index favorites_customer_id_idx on public.favorites (customer_id);
create index favorites_business_id_idx on public.favorites (business_id);
