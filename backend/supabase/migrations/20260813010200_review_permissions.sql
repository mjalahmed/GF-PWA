-- Phase 9: review permissions

insert into public.permissions (code, description) values
  ('review.eligibility.read_own', 'Read own review eligibilities'),
  ('review.create', 'Create verified reviews'),
  ('review.read_own', 'Read own reviews'),
  ('review.update_own', 'Update own reviews'),
  ('review.report', 'Report reviews'),
  ('review.public.read', 'Read published reviews'),
  ('business.review.read', 'Read business reviews'),
  ('business.review.respond', 'Respond to business reviews'),
  ('review.moderate', 'Moderate reviews'),
  ('review.report.read', 'Read review reports'),
  ('review.report.resolve', 'Resolve review reports')
on conflict (code) do nothing;

-- Customer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'review.eligibility.read_own',
    'review.create',
    'review.read_own',
    'review.update_own',
    'review.report',
    'review.public.read'
  )
on conflict do nothing;

-- Business owner / manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'business.review.read',
    'business.review.respond',
    'review.public.read'
  )
on conflict do nothing;

-- Staff: read only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'business.review.read',
    'review.public.read'
  )
on conflict do nothing;

-- Content moderator
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'content_moderator'
  and p.code in (
    'review.moderate',
    'review.report.read',
    'review.report.resolve',
    'review.public.read'
  )
on conflict do nothing;

-- Admins
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'review.%'
    or p.code like 'business.review.%'
  )
on conflict do nothing;
