-- RLS for business management tables + public business read
alter table public.business_settings enable row level security;
alter table public.business_opening_hours enable row level security;
alter table public.business_closure_dates enable row level security;
alter table public.business_invitations enable row level security;

-- Public can read active verified businesses (limited columns via views/API; table SELECT still member-or-public-safe)
drop policy if exists businesses_select_member_or_officer on public.businesses;
create policy businesses_select_member_officer_or_public
  on public.businesses for select to authenticated, anon
  using (
    (
      status = 'active'
      and verification_status = 'verified'
    )
    or public.is_business_member(id, true)
    or public.has_permission('business.view')
    or public.has_permission('business.read')
    or public.has_permission('business.public.read')
    or public.has_role('onboarding_officer')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('auditor')
  );

drop policy if exists business_branches_select_member_or_officer on public.business_branches;
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
    or public.has_permission('business.view')
    or public.has_permission('business.branch.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('auditor')
  );

create policy business_settings_select_member
  on public.business_settings for select to authenticated
  using (
    public.is_business_member(business_id, true)
    or public.has_permission('business.settings.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

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
    or public.has_permission('business.schedule.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy business_closure_dates_select_member
  on public.business_closure_dates for select to authenticated
  using (
    public.is_business_member(business_id, true)
    or public.has_permission('business.schedule.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy business_invitations_select_member
  on public.business_invitations for select to authenticated
  using (
    public.is_business_member(business_id, true)
    or public.has_permission('business.member.invite')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

grant select on public.business_settings to authenticated, service_role;
grant select on public.business_opening_hours to authenticated, anon, service_role;
grant select on public.business_closure_dates to authenticated, service_role;
grant select on public.business_invitations to authenticated, service_role;

grant insert, update, delete on public.business_settings to service_role;
grant insert, update, delete on public.business_opening_hours to service_role;
grant insert, update, delete on public.business_closure_dates to service_role;
grant insert, update, delete on public.business_invitations to service_role;

-- Keep businesses/branches/memberships mutations service_role only
grant select on public.businesses to anon;
grant select on public.business_branches to anon;
