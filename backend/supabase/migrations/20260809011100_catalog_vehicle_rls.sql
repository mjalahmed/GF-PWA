-- Catalog / vehicle / favorites RLS
alter table public.service_categories enable row level security;
alter table public.product_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_images enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_inventory enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_vehicle_compatibility enable row level security;
alter table public.product_vehicle_compatibility enable row level security;
alter table public.favorites enable row level security;

-- Categories and vehicle reference: public read of active rows
create policy service_categories_select_active
  on public.service_categories for select to authenticated, anon
  using (is_active = true or auth.role() = 'service_role');

create policy product_categories_select_active
  on public.product_categories for select to authenticated, anon
  using (is_active = true or auth.role() = 'service_role');

create policy vehicle_makes_select_active
  on public.vehicle_makes for select to authenticated, anon
  using (is_active = true or auth.role() = 'service_role');

create policy vehicle_models_select_active
  on public.vehicle_models for select to authenticated, anon
  using (is_active = true or auth.role() = 'service_role');

-- Services: public active for active verified businesses; members see all own
create policy services_select_public_or_member
  on public.services for select to authenticated, anon
  using (
    (
      is_active = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id
          and b.status = 'active'
          and b.verification_status = 'verified'
      )
    )
    or public.is_business_member(business_id, true)
    or public.has_permission('business.service.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy service_images_select_via_service
  on public.service_images for select to authenticated, anon
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id
        and (
          (
            s.is_active = true
            and exists (
              select 1 from public.businesses b
              where b.id = s.business_id
                and b.status = 'active'
                and b.verification_status = 'verified'
            )
          )
          or public.is_business_member(s.business_id, true)
        )
    )
  );

create policy products_select_public_or_member
  on public.products for select to authenticated, anon
  using (
    (
      is_active = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id
          and b.status = 'active'
          and b.verification_status = 'verified'
      )
    )
    or public.is_business_member(business_id, true)
    or public.has_permission('business.product.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy product_images_select_via_product
  on public.product_images for select to authenticated, anon
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          (
            p.is_active = true
            and exists (
              select 1 from public.businesses b
              where b.id = p.business_id
                and b.status = 'active'
                and b.verification_status = 'verified'
            )
          )
          or public.is_business_member(p.business_id, true)
        )
    )
  );

-- Inventory: members only (no public quantity)
create policy product_inventory_select_member
  on public.product_inventory for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          public.is_business_member(p.business_id, true)
          or public.has_permission('business.inventory.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy inventory_adjustments_select_member
  on public.inventory_adjustments for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          public.is_business_member(p.business_id, true)
          or public.has_permission('business.inventory.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

-- Compatibility readable with parent catalog item
create policy service_compat_select
  on public.service_vehicle_compatibility for select to authenticated, anon
  using (
    exists (select 1 from public.services s where s.id = service_id)
  );

create policy product_compat_select
  on public.product_vehicle_compatibility for select to authenticated, anon
  using (
    exists (select 1 from public.products p where p.id = product_id)
  );

-- Vehicles: owner only
create policy vehicles_select_own
  on public.vehicles for select to authenticated
  using (customer_id = auth.uid());

create policy vehicles_insert_own
  on public.vehicles for insert to authenticated
  with check (customer_id = auth.uid());

create policy vehicles_update_own
  on public.vehicles for update to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Favorites: own only
create policy favorites_select_own
  on public.favorites for select to authenticated
  using (customer_id = auth.uid());

create policy favorites_insert_own
  on public.favorites for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status = 'active'
        and b.verification_status = 'verified'
    )
  );

create policy favorites_delete_own
  on public.favorites for delete to authenticated
  using (customer_id = auth.uid());

-- Grants: clients select; mutations via service_role (except vehicles/favorites own writes)
grant select on public.service_categories, public.product_categories,
  public.services, public.service_images, public.products, public.product_images,
  public.vehicle_makes, public.vehicle_models,
  public.service_vehicle_compatibility, public.product_vehicle_compatibility
  to authenticated, anon, service_role;

grant select on public.product_inventory, public.inventory_adjustments
  to authenticated, service_role;

grant select, insert, update on public.vehicles to authenticated, service_role;
grant select, insert, delete on public.favorites to authenticated, service_role;

grant insert, update, delete on
  public.service_categories, public.product_categories,
  public.services, public.service_images, public.products, public.product_images,
  public.product_inventory, public.inventory_adjustments,
  public.vehicle_makes, public.vehicle_models,
  public.service_vehicle_compatibility, public.product_vehicle_compatibility
  to service_role;

grant delete on public.vehicles to service_role;
