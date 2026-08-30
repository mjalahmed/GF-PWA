-- Additive foundation permissions (align with TypeScript Permissions registry).
-- Does not rename existing codes used by RLS (audit.view, user.suspend, role.assign, …).

insert into public.permissions (code, description) values
  ('profile.read_own', 'Read own profile'),
  ('profile.update_own', 'Update own profile'),
  ('profile.read_all', 'Read all profiles'),
  ('profile.suspend', 'Suspend a profile'),
  ('role.read', 'Read roles'),
  ('business.application.create', 'Create a business application'),
  ('business.application.read_own', 'Read own business applications'),
  ('business.application.read_all', 'Read all business applications'),
  ('business.application.approve', 'Approve a business application'),
  ('business.application.reject', 'Reject a business application')
on conflict (code) do nothing;

-- Grant customer profile self-service + application create
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'profile.read_own',
    'profile.update_own',
    'business.application.create',
    'business.application.read_own'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'onboarding_officer'
  and p.code in (
    'business.application.read_all',
    'business.application.approve',
    'business.application.reject',
    'profile.read_all'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
on conflict do nothing;
