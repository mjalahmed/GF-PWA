-- In-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create index notifications_entity_idx
  on public.notifications (entity_type, entity_id);

alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated, service_role;
grant insert, delete on public.notifications to service_role;

-- Extend approval function to emit applicant notification
create or replace function public.approve_business_application(
  p_application_id uuid,
  p_actor_user_id uuid,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.business_applications%rowtype;
  v_branch public.business_application_branches%rowtype;
  v_business_id uuid;
  v_slug text;
  v_slug_base text;
  v_owner_role_id uuid;
  v_existing_business_id uuid;
begin
  select *
  into v_app
  from public.business_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if v_app.status = 'approved' and v_app.created_business_id is not null then
    return jsonb_build_object(
      'success', true,
      'businessId', v_app.created_business_id,
      'idempotent', true
    );
  end if;

  if v_app.status <> 'under_review' then
    raise exception 'INVALID_STATUS: application must be under_review, got %', v_app.status
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_app.applicant_user_id
      and p.status = 'active'
  ) then
    raise exception 'APPLICANT_INACTIVE'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.business_document_requirements dr
    where dr.business_category_id = v_app.business_category_id
      and dr.is_required = true
      and dr.is_active = true
      and not exists (
        select 1
        from public.business_application_documents doc
        where doc.application_id = v_app.id
          and doc.document_requirement_id = dr.id
          and doc.status = 'approved'
      )
  ) then
    raise exception 'REQUIRED_DOCUMENTS_NOT_APPROVED'
      using errcode = 'P0001';
  end if;

  select *
  into v_branch
  from public.business_application_branches
  where application_id = v_app.id;

  if not found
    or v_branch.address_line is null
    or btrim(v_branch.address_line) = ''
  then
    raise exception 'BRANCH_INFORMATION_INCOMPLETE'
      using errcode = 'P0001';
  end if;

  if v_app.commercial_registration_number is not null then
    select b.id
    into v_existing_business_id
    from public.businesses b
    where b.commercial_registration_number = v_app.commercial_registration_number
    limit 1;

    if v_existing_business_id is not null then
      raise exception 'COMMERCIAL_REGISTRATION_EXISTS'
        using errcode = 'P0001';
    end if;
  end if;

  v_slug_base := lower(
    regexp_replace(
      btrim(v_app.display_name),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
  v_slug_base := trim(both '-' from v_slug_base);

  if v_slug_base = '' then
    v_slug_base := 'business';
  end if;

  v_slug := v_slug_base;

  if exists (select 1 from public.businesses b where b.slug = v_slug) then
    v_slug := v_slug_base || '-' || left(replace(gen_random_uuid()::text, '-', ''), 8);
  end if;

  insert into public.businesses (
    slug,
    business_category_id,
    legal_name,
    display_name,
    description,
    commercial_registration_number,
    phone,
    email,
    website,
    status,
    verification_status,
    source_application_id,
    approved_at,
    approved_by
  )
  values (
    v_slug,
    v_app.business_category_id,
    v_app.legal_name,
    v_app.display_name,
    v_app.description,
    v_app.commercial_registration_number,
    v_app.phone,
    v_app.email,
    v_app.website,
    'active',
    'verified',
    v_app.id,
    timezone('utc', now()),
    p_actor_user_id
  )
  returning id into v_business_id;

  insert into public.business_memberships (
    business_id,
    user_id,
    role,
    status,
    invited_by,
    accepted_at
  )
  values (
    v_business_id,
    v_app.applicant_user_id,
    'owner',
    'active',
    p_actor_user_id,
    timezone('utc', now())
  );

  insert into public.business_branches (
    business_id,
    name,
    phone,
    email,
    address_line,
    area,
    city,
    country_code,
    latitude,
    longitude,
    timezone,
    is_primary,
    is_active
  )
  values (
    v_business_id,
    coalesce(nullif(btrim(v_branch.name), ''), v_app.display_name),
    coalesce(v_branch.phone, v_app.phone),
    coalesce(v_branch.email, v_app.email),
    v_branch.address_line,
    v_branch.area,
    v_branch.city,
    coalesce(v_branch.country_code, 'BH'),
    v_branch.latitude,
    v_branch.longitude,
    coalesce(v_branch.timezone, 'Asia/Bahrain'),
    true,
    true
  );

  select r.id
  into v_owner_role_id
  from public.roles r
  where r.code = 'business_owner'
  limit 1;

  if v_owner_role_id is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_app.applicant_user_id, v_owner_role_id, p_actor_user_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  update public.business_applications
  set
    status = 'approved',
    approved_at = timezone('utc', now()),
    created_business_id = v_business_id,
    updated_at = timezone('utc', now())
  where id = v_app.id;

  insert into public.business_application_reviews (
    application_id,
    reviewer_user_id,
    action,
    previous_status,
    new_status
  )
  values (
    v_app.id,
    p_actor_user_id,
    'approved',
    v_app.status::text,
    'approved'
  );

  perform public.write_audit_log(
    p_actor_user_id,
    'business.application.approved',
    'business_application',
    v_app.id,
    v_app.status::text,
    'approved',
    null,
    p_request_id,
    null,
    jsonb_build_object(
      'business_id', v_business_id,
      'slug', v_slug
    )
  );

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_app.applicant_user_id,
    'business_application.approved',
    'Application approved',
    format('Your business application for %s has been approved.', v_app.display_name),
    'business_application',
    v_app.id,
    jsonb_build_object(
      'business_id', v_business_id,
      'slug', v_slug
    )
  );

  return jsonb_build_object(
    'success', true,
    'businessId', v_business_id,
    'slug', v_slug,
    'idempotent', false
  );
end;
$$;

revoke all on function public.approve_business_application(uuid, uuid, text) from public;
grant execute on function public.approve_business_application(uuid, uuid, text) to service_role;
