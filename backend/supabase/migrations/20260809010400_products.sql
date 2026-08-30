-- Products catalog
create type public.product_stock_status as enum (
  'in_stock',
  'low_stock',
  'out_of_stock',
  'preorder',
  'unavailable'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid references public.business_branches (id) on delete set null,
  category_id uuid not null references public.product_categories (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  sku text,
  brand text,
  price numeric(12, 3) not null,
  sale_price numeric(12, 3),
  stock_status public.product_stock_status not null default 'in_stock',
  warranty_description text,
  installation_available boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, slug),
  constraint products_price_nonneg_check
    check (price >= 0 and coalesce(sale_price, 0) >= 0),
  constraint products_sale_price_lte_price_check
    check (sale_price is null or sale_price <= price)
);

create unique index products_business_sku_uidx
  on public.products (business_id, lower(sku))
  where sku is not null;

create index products_business_id_idx on public.products (business_id);
create index products_category_id_idx on public.products (category_id);
create index products_branch_id_idx on public.products (branch_id);
create index products_business_active_idx on public.products (business_id, is_active);
create index products_name_lower_idx on public.products (lower(name));
create index products_brand_lower_idx on public.products (lower(brand));

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
