-- Service images
create table public.service_images (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index service_images_service_id_idx on public.service_images (service_id);

create unique index service_images_one_primary_uidx
  on public.service_images (service_id)
  where is_primary = true;
