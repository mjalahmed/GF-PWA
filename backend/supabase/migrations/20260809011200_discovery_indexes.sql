-- Discovery / catalog indexes
create index if not exists businesses_display_name_lower_idx
  on public.businesses (lower(display_name));

create index if not exists businesses_active_verified_idx
  on public.businesses (status, verification_status)
  where status = 'active' and verification_status = 'verified';

create index if not exists business_branches_city_lower_idx
  on public.business_branches (lower(city));

create index if not exists business_branches_area_lower_idx
  on public.business_branches (lower(area));

create index if not exists business_branches_lat_lng_idx
  on public.business_branches (latitude, longitude)
  where latitude is not null and longitude is not null and is_active = true;

create index if not exists services_public_lookup_idx
  on public.services (business_id, category_id, is_active);

create index if not exists products_public_lookup_idx
  on public.products (business_id, category_id, is_active, stock_status);
