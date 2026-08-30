-- RLS helpers and policies for business onboarding
create or replace function public.is_application_applicant(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_applications ba
    where ba.id = p_application_id
      and ba.applicant_user_id = auth.uid()
  );
$$;

create or replace function public.application_status_is_editable(p_status public.business_application_status)
returns boolean
language sql
immutable
as $$
  select p_status in ('draft', 'changes_requested');
$$;

create or replace function public.is_business_member(
  p_business_id uuid,
  p_require_active boolean default true
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
      and (
        not p_require_active
        or bm.status = 'active'
      )
  );
$$;

create or replace function public.can_review_business_applications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or public.has_permission('business.application.read_all')
    or public.has_permission('business.document.review')
    or public.has_role('onboarding_officer')
    or public.has_role('admin')
    or public.has_role('super_admin');
$$;

revoke all on function public.is_application_applicant(uuid) from public;
revoke all on function public.application_status_is_editable(public.business_application_status) from public;
revoke all on function public.is_business_member(uuid, boolean) from public;
revoke all on function public.can_review_business_applications() from public;

grant execute on function public.is_application_applicant(uuid) to authenticated, service_role;
grant execute on function public.application_status_is_editable(public.business_application_status) to authenticated, service_role;
grant execute on function public.is_business_member(uuid, boolean) to authenticated, service_role;
grant execute on function public.can_review_business_applications() to authenticated, service_role;

alter table public.business_categories enable row level security;
alter table public.business_applications enable row level security;
alter table public.business_application_branches enable row level security;
alter table public.business_application_steps enable row level security;
alter table public.business_document_requirements enable row level security;
alter table public.business_application_documents enable row level security;
alter table public.business_application_reviews enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.business_branches enable row level security;

create policy business_categories_select_active
  on public.business_categories for select to authenticated
  using (is_active = true);

create policy business_applications_select_own_or_reviewer
  on public.business_applications for select to authenticated
  using (
    applicant_user_id = auth.uid()
    or public.has_permission('business.application.read_all')
    or public.has_role('onboarding_officer')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('auditor')
  );

create policy business_applications_insert_own
  on public.business_applications for insert to authenticated
  with check (
    applicant_user_id = auth.uid()
    and public.has_permission('business.application.create')
  );

create policy business_applications_update_own_editable
  on public.business_applications for update to authenticated
  using (
    applicant_user_id = auth.uid()
    and public.application_status_is_editable(status)
  )
  with check (
    applicant_user_id = auth.uid()
    and public.application_status_is_editable(status)
  );

create policy business_application_branches_select_own_or_reviewer
  on public.business_application_branches for select to authenticated
  using (
    public.is_application_applicant(application_id)
    or public.can_review_business_applications()
  );

create policy business_application_branches_insert_own_editable
  on public.business_application_branches for insert to authenticated
  with check (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_application_branches_update_own_editable
  on public.business_application_branches for update to authenticated
  using (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  )
  with check (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_application_steps_select_own_or_reviewer
  on public.business_application_steps for select to authenticated
  using (
    public.is_application_applicant(application_id)
    or public.can_review_business_applications()
  );

create policy business_application_steps_update_own_editable
  on public.business_application_steps for update to authenticated
  using (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  )
  with check (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_document_requirements_select_active
  on public.business_document_requirements for select to authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.business_categories bc
      where bc.id = business_category_id
        and bc.is_active = true
    )
  );

create policy business_application_documents_select_own_or_reviewer
  on public.business_application_documents for select to authenticated
  using (
    public.is_application_applicant(application_id)
    or public.has_permission('business.document.read')
    or public.can_review_business_applications()
  );

create policy business_application_documents_insert_own_editable
  on public.business_application_documents for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_application_documents_update_own_editable
  on public.business_application_documents for update to authenticated
  using (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  )
  with check (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_application_documents_delete_own_editable
  on public.business_application_documents for delete to authenticated
  using (
    public.is_application_applicant(application_id)
    and exists (
      select 1
      from public.business_applications ba
      where ba.id = application_id
        and public.application_status_is_editable(ba.status)
    )
  );

create policy business_application_reviews_select_own_or_reviewer
  on public.business_application_reviews for select to authenticated
  using (
    public.is_application_applicant(application_id)
    or public.can_review_business_applications()
    or public.has_role('auditor')
  );

create policy businesses_select_member_or_officer
  on public.businesses for select to authenticated
  using (
    public.is_business_member(id)
    or public.has_permission('business.view')
    or public.can_review_business_applications()
    or public.has_role('auditor')
  );

create policy business_memberships_select_member_or_self
  on public.business_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_business_member(business_id)
    or public.has_permission('business.view')
    or public.can_review_business_applications()
    or public.has_role('auditor')
  );

create policy business_branches_select_member_or_officer
  on public.business_branches for select to authenticated
  using (
    public.is_business_member(business_id)
    or public.has_permission('business.view')
    or public.can_review_business_applications()
    or public.has_role('auditor')
  );

grant select on public.business_categories to authenticated, service_role;
grant select, insert, update on public.business_applications to authenticated, service_role;
grant select, insert, update on public.business_application_branches to authenticated, service_role;
grant select, update on public.business_application_steps to authenticated, service_role;
grant select on public.business_document_requirements to authenticated, service_role;
grant select, insert, update, delete on public.business_application_documents to authenticated, service_role;
grant select on public.business_application_reviews to authenticated, service_role;
grant select on public.businesses to authenticated, service_role;
grant select on public.business_memberships to authenticated, service_role;
grant select on public.business_branches to authenticated, service_role;

grant insert, update, delete on public.business_categories to service_role;
grant delete on public.business_applications to service_role;
grant delete on public.business_application_branches to service_role;
grant insert, delete on public.business_application_steps to service_role;
grant insert, update, delete on public.business_document_requirements to service_role;
grant insert, update, delete on public.businesses to service_role;
grant insert, update, delete on public.business_memberships to service_role;
grant insert, update, delete on public.business_branches to service_role;
grant insert on public.business_application_reviews to service_role;
