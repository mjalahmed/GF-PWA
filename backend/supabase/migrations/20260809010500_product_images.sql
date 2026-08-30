-- Product images
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index product_images_product_id_idx on public.product_images (product_id);

create unique index product_images_one_primary_uidx
  on public.product_images (product_id)
  where is_primary = true;
