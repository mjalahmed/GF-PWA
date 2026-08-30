-- Private storage bucket for business application documents
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-application-documents',
  'business-application-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy business_application_documents_storage_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-application-documents'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy business_application_documents_storage_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'business-application-documents'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy business_application_documents_storage_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'business-application-documents'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'business-application-documents'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy business_application_documents_storage_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-application-documents'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy business_application_documents_storage_select_reviewer
  on storage.objects for select to authenticated
  using (
    bucket_id = 'business-application-documents'
    and (
      public.has_permission('business.document.read')
      or public.has_permission('business.document.review')
      or public.has_permission('business.application.read_all')
      or public.has_role('onboarding_officer')
      or public.has_role('admin')
      or public.has_role('super_admin')
    )
  );

create policy business_application_documents_storage_service_role_all
  on storage.objects for all to service_role
  using (bucket_id = 'business-application-documents')
  with check (bucket_id = 'business-application-documents');
