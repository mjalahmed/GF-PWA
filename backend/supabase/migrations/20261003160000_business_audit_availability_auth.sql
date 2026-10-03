-- Business-scoped audit, owner availability override, and tighter business RLS/storage.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.try_parse_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;
  return btrim(value)::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function public.try_parse_uuid(text) from public;
grant execute on function public.try_parse_uuid(text) to anon, authenticated, service_role;

create or replace function public.is_business_manager_or_owner(
  p_business_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_business_id is not null
    and p_user_id is not null
    and exists (
      select 1
      from public.business_memberships m
      where m.business_id = p_business_id
        and m.user_id = p_user_id
        and m.status = 'active'
        and m.role in ('owner', 'manager')
    );
$$;

revoke all on function public.is_business_manager_or_owner(uuid, uuid) from public;
grant execute on function public.is_business_manager_or_owner(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Operational availability. Independent of weekly hours and closure dates.
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists temporarily_closed boolean not null default false,
  add column if not exists temporary_closure_reason text,
  add column if not exists temporarily_closed_at timestamptz,
  add column if not exists temporarily_closed_by uuid references public.profiles (id) on delete set null;

alter table public.businesses
  drop constraint if exists businesses_temporary_closure_reason_len_check;
alter table public.businesses
  add constraint businesses_temporary_closure_reason_len_check
  check (
    temporary_closure_reason is null
    or char_length(temporary_closure_reason) <= 500
  );

-- ---------------------------------------------------------------------------
-- Audit scope columns. Existing write_audit_log callers keep working.
-- ---------------------------------------------------------------------------

alter table public.audit_logs
  add column if not exists business_id uuid references public.businesses (id) on delete set null,
  add column if not exists branch_id uuid,
  add column if not exists actor_role text;

create index if not exists audit_logs_business_created_idx
  on public.audit_logs (business_id, created_at desc)
  where business_id is not null;

create index if not exists audit_logs_business_actor_created_idx
  on public.audit_logs (business_id, actor_user_id, created_at desc)
  where business_id is not null;

create index if not exists audit_logs_business_action_created_idx
  on public.audit_logs (business_id, action, created_at desc)
  where business_id is not null;

create index if not exists audit_logs_business_entity_idx
  on public.audit_logs (business_id, entity_type, entity_id)
  where business_id is not null;

create index if not exists audit_logs_business_branch_created_idx
  on public.audit_logs (business_id, branch_id, created_at desc)
  where business_id is not null and branch_id is not null;

drop function if exists public.write_audit_log(
  uuid, text, text, uuid, text, text, text, text, jsonb, jsonb, jsonb
);

create or replace function public.write_audit_log(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_previous_status text default null,
  p_new_status text default null,
  p_reason text default null,
  p_request_id text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_business_id uuid default null,
  p_branch_id uuid default null,
  p_actor_role text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_business_id uuid := p_business_id;
  v_branch_id uuid := p_branch_id;
  v_actor_role text := nullif(btrim(coalesce(p_actor_role, '')), '');
begin
  if v_business_id is null then
    v_business_id := coalesce(
      public.try_parse_uuid(v_metadata->>'businessId'),
      public.try_parse_uuid(v_metadata->>'business_id'),
      public.try_parse_uuid(p_new_values->>'businessId'),
      public.try_parse_uuid(p_new_values->>'business_id'),
      public.try_parse_uuid(p_old_values->>'businessId'),
      public.try_parse_uuid(p_old_values->>'business_id')
    );
  end if;

  if v_branch_id is null then
    v_branch_id := coalesce(
      public.try_parse_uuid(v_metadata->>'branchId'),
      public.try_parse_uuid(v_metadata->>'branch_id'),
      public.try_parse_uuid(p_new_values->>'branchId'),
      public.try_parse_uuid(p_new_values->>'branch_id'),
      public.try_parse_uuid(p_old_values->>'branchId'),
      public.try_parse_uuid(p_old_values->>'branch_id')
    );
  end if;

  if v_business_id is not null and not exists (
    select 1 from public.businesses b where b.id = v_business_id
  ) then
    v_business_id := null;
  end if;

  if v_actor_role is null and v_business_id is not null and p_actor_user_id is not null then
    select m.role::text
    into v_actor_role
    from public.business_memberships m
    where m.business_id = v_business_id
      and m.user_id = p_actor_user_id
      and m.status = 'active'
    limit 1;
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, action, entity_type, entity_id,
    business_id, branch_id,
    previous_status, new_status, reason, request_id,
    old_values, new_values, metadata
  ) values (
    p_actor_user_id, v_actor_role, p_action, p_entity_type, p_entity_id,
    v_business_id, v_branch_id,
    p_previous_status, p_new_status, p_reason, p_request_id,
    p_old_values, p_new_values, v_metadata
  )
  returning id into log_id;
  return log_id;
end;
$$;

revoke all on function public.write_audit_log(
  uuid, text, text, uuid, text, text, text, text, jsonb, jsonb, jsonb, uuid, uuid, text
) from public;
grant execute on function public.write_audit_log(
  uuid, text, text, uuid, text, text, text, text, jsonb, jsonb, jsonb, uuid, uuid, text
) to service_role;

update public.audit_logs l
set business_id = parsed.business_id
from (
  select
    id,
    coalesce(
      public.try_parse_uuid(metadata->>'businessId'),
      public.try_parse_uuid(metadata->>'business_id'),
      public.try_parse_uuid(new_values->>'businessId'),
      public.try_parse_uuid(new_values->>'business_id'),
      public.try_parse_uuid(old_values->>'businessId'),
      public.try_parse_uuid(old_values->>'business_id')
    ) as business_id
  from public.audit_logs
  where business_id is null
) parsed
join public.businesses b on b.id = parsed.business_id
where l.id = parsed.id;

update public.audit_logs
set branch_id = coalesce(
  public.try_parse_uuid(metadata->>'branchId'),
  public.try_parse_uuid(metadata->>'branch_id'),
  public.try_parse_uuid(new_values->>'branchId'),
  public.try_parse_uuid(new_values->>'branch_id'),
  public.try_parse_uuid(old_values->>'branchId'),
  public.try_parse_uuid(old_values->>'branch_id')
)
where branch_id is null;

update public.audit_logs l
set actor_role = m.role::text
from public.business_memberships m
where l.actor_role is null
  and l.business_id is not null
  and l.actor_user_id is not null
  and m.business_id = l.business_id
  and m.user_id = l.actor_user_id
  and m.status = 'active';

-- Owners read only their business rows. Platform audit.view remains separate.
drop policy if exists audit_logs_select_business_owner on public.audit_logs;
create policy audit_logs_select_business_owner
  on public.audit_logs for select to authenticated
  using (
    business_id is not null
    and public.is_active_business_owner(business_id)
  );

-- ---------------------------------------------------------------------------
-- Permissions: schedule writes and audit reads are owner-only.
-- ---------------------------------------------------------------------------

insert into public.permissions (code, description) values
  ('business.audit.read', 'Read audit logs for one business')
on conflict (code) do nothing;

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.code = 'business_manager'
  and p.code = 'business.schedule.update';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and p.code = 'business.audit.read'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS: business data is membership-scoped. Global permission codes are not
-- a tenant boundary because business_owner is assigned once per person.
-- ---------------------------------------------------------------------------

drop policy if exists businesses_select_member_officer_or_public on public.businesses;
create policy businesses_select_member_officer_or_public
  on public.businesses for select to authenticated, anon
  using (
    (
      status = 'active'
      and verification_status = 'verified'
    )
    or public.is_business_member(id, true)
    or public.has_role('onboarding_officer')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('auditor')
  );

drop policy if exists business_branches_select_member_officer_or_public on public.business_branches;
create policy business_branches_select_member_officer_or_public
  on public.business_branches for select to authenticated, anon
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
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('auditor')
  );

drop policy if exists business_settings_select_member on public.business_settings;
create policy business_settings_select_member
  on public.business_settings for select to authenticated
  using (
    public.is_business_member(business_id, true)
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists business_opening_hours_select_member_or_public on public.business_opening_hours;
create policy business_opening_hours_select_member_or_public
  on public.business_opening_hours for select to authenticated, anon
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status = 'active'
        and b.verification_status = 'verified'
    )
    or public.is_business_member(business_id, true)
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists business_closure_dates_select_member on public.business_closure_dates;
create policy business_closure_dates_select_member
  on public.business_closure_dates for select to authenticated
  using (
    public.is_business_member(business_id, true)
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists business_invitations_select_member on public.business_invitations;
create policy business_invitations_select_manager
  on public.business_invitations for select to authenticated
  using (
    public.is_business_manager_or_owner(business_id)
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

-- ---------------------------------------------------------------------------
-- Business branding storage. Appointment/vehicle media stays on its own buckets.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists business_media_public_select on storage.objects;
create policy business_media_public_select
  on storage.objects for select to authenticated, anon
  using (
    bucket_id = 'business-media'
    and public.try_parse_uuid((storage.foldername(name))[1]) is not null
    and (storage.foldername(name))[2] in ('logo', 'cover', 'gallery')
  );

drop policy if exists business_media_write_manager on storage.objects;
create policy business_media_write_manager
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[2] in ('logo', 'cover', 'gallery')
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

drop policy if exists business_media_update_manager on storage.objects;
create policy business_media_update_manager
  on storage.objects for update to authenticated
  using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[2] in ('logo', 'cover', 'gallery')
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  )
  with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[2] in ('logo', 'cover', 'gallery')
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

drop policy if exists business_media_delete_manager on storage.objects;
create policy business_media_delete_manager
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[2] in ('logo', 'cover', 'gallery')
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

drop policy if exists business_media_application_select on storage.objects;
create policy business_media_application_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'applications'
    and (
      public.is_application_applicant(public.try_parse_uuid((storage.foldername(name))[2]))
      or public.can_review_business_applications()
    )
  );

drop policy if exists business_media_application_write on storage.objects;
create policy business_media_application_write
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[3] in ('logo', 'cover', 'gallery')
    and public.is_application_applicant(public.try_parse_uuid((storage.foldername(name))[2]))
    and exists (
      select 1
      from public.business_applications a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and public.application_status_is_editable(a.status)
    )
  );

drop policy if exists business_media_application_update on storage.objects;
create policy business_media_application_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'applications'
    and public.is_application_applicant(public.try_parse_uuid((storage.foldername(name))[2]))
    and exists (
      select 1
      from public.business_applications a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and public.application_status_is_editable(a.status)
    )
  )
  with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'applications'
    and (storage.foldername(name))[3] in ('logo', 'cover', 'gallery')
    and public.is_application_applicant(public.try_parse_uuid((storage.foldername(name))[2]))
  );

drop policy if exists business_media_application_delete on storage.objects;
create policy business_media_application_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'applications'
    and public.is_application_applicant(public.try_parse_uuid((storage.foldername(name))[2]))
    and exists (
      select 1
      from public.business_applications a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and public.application_status_is_editable(a.status)
    )
  );

drop policy if exists business_media_service_role_all on storage.objects;
create policy business_media_service_role_all
  on storage.objects for all to service_role
  using (bucket_id = 'business-media')
  with check (bucket_id = 'business-media');

-- Catalog images follow the same manager/owner write rule as the API permission map.
drop policy if exists service_images_storage_write_member on storage.objects;
drop policy if exists service_images_storage_update_member on storage.objects;
drop policy if exists service_images_storage_delete_member on storage.objects;
drop policy if exists product_images_storage_write_member on storage.objects;
drop policy if exists product_images_storage_update_member on storage.objects;
drop policy if exists product_images_storage_delete_member on storage.objects;

create policy service_images_storage_write_manager
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

create policy service_images_storage_update_manager
  on storage.objects for update to authenticated
  using (
    bucket_id = 'service-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  )
  with check (
    bucket_id = 'service-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

create policy service_images_storage_delete_manager
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

create policy product_images_storage_write_manager
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

create policy product_images_storage_update_manager
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  )
  with check (
    bucket_id = 'product-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );

create policy product_images_storage_delete_manager
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_business_manager_or_owner(
      public.try_parse_uuid((storage.foldername(name))[1])
    )
  );
