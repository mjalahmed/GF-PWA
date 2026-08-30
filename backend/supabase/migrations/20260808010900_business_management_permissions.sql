-- Phase 3 business-management permissions
insert into public.permissions (code, description) values
  ('business.read', 'Read business internal profile'),
  ('business.update', 'Update business profile fields'),
  ('business.settings.read', 'Read business settings'),
  ('business.settings.update', 'Update business settings'),
  ('business.branch.read', 'Read business branches'),
  ('business.branch.create', 'Create business branches'),
  ('business.branch.update', 'Update business branches'),
  ('business.branch.delete', 'Deactivate business branches'),
  ('business.member.read', 'Read business members'),
  ('business.member.invite', 'Invite business members'),
  ('business.member.update', 'Update business member roles'),
  ('business.member.suspend', 'Suspend business members'),
  ('business.member.remove', 'Remove business members'),
  ('business.member.assign_owner', 'Assign owner membership'),
  ('business.schedule.read', 'Read opening hours and closures'),
  ('business.schedule.update', 'Update opening hours and closures'),
  ('business.public.read', 'Read public business profile')
on conflict (code) do nothing;

-- Global role grants
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_owner'
  and p.code in (
    'business.read', 'business.update',
    'business.settings.read', 'business.settings.update',
    'business.branch.read', 'business.branch.create', 'business.branch.update', 'business.branch.delete',
    'business.member.read', 'business.member.invite', 'business.member.update',
    'business.member.suspend', 'business.member.remove', 'business.member.assign_owner',
    'business.schedule.read', 'business.schedule.update',
    'business.public.read', 'business.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_manager'
  and p.code in (
    'business.read', 'business.update',
    'business.settings.read', 'business.settings.update',
    'business.branch.read', 'business.branch.create', 'business.branch.update',
    'business.member.read', 'business.member.invite', 'business.member.update',
    'business.member.suspend',
    'business.schedule.read', 'business.schedule.update',
    'business.public.read', 'business.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'business.read',
    'business.branch.read',
    'business.member.read',
    'business.schedule.read',
    'business.public.read',
    'business.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and p.code like 'business.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code = 'business.public.read'
on conflict do nothing;
