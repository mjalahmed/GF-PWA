-- Catalog and vehicle image storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'service-images',
    'service-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'product-images',
    'product-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'vehicle-images',
    'vehicle-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {businessId}/{serviceId|productId}/{filename}
-- Vehicle path: {customerId}/{vehicleId}/{filename}

create policy service_images_storage_select_public
  on storage.objects for select to authenticated, anon
  using (bucket_id = 'service-images');

create policy service_images_storage_write_member
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy service_images_storage_update_member
  on storage.objects for update to authenticated
  using (
    bucket_id = 'service-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy service_images_storage_delete_member
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy product_images_storage_select_public
  on storage.objects for select to authenticated, anon
  using (bucket_id = 'product-images');

create policy product_images_storage_write_member
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy product_images_storage_update_member
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy product_images_storage_delete_member
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_member((storage.foldername(name))[1]::uuid, true)
  );

create policy vehicle_images_storage_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy vehicle_images_storage_write_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy vehicle_images_storage_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy vehicle_images_storage_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy catalog_storage_service_role_all
  on storage.objects for all to service_role
  using (bucket_id in ('service-images', 'product-images', 'vehicle-images'))
  with check (bucket_id in ('service-images', 'product-images', 'vehicle-images'));
