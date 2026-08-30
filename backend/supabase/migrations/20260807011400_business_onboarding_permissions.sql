-- Phase 2 business onboarding permissions
insert into public.permissions (code, description) values
  ('business.application.update_own', 'Update own draft business application'),
  ('business.application.submit', 'Submit a business application for review'),
  ('business.application.withdraw', 'Withdraw a submitted business application'),
  ('business.application.assign_reviewer', 'Assign a reviewer to a business application'),
  ('business.application.start_review', 'Start review of a submitted business application'),
  ('business.application.request_changes', 'Request changes on a business application'),
  ('business.document.read', 'Read business application documents'),
  ('business.document.review', 'Review business application documents'),
  ('business.create_from_application', 'Create a business from an approved application')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'business.application.update_own',
    'business.application.submit',
    'business.application.withdraw'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'onboarding_officer'
  and p.code in (
    'business.application.assign_reviewer',
    'business.application.start_review',
    'business.application.request_changes',
    'business.document.read',
    'business.document.review',
    'business.create_from_application'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'admin'
  and p.code in (
    'business.application.update_own',
    'business.application.submit',
    'business.application.withdraw',
    'business.application.assign_reviewer',
    'business.application.start_review',
    'business.application.request_changes',
    'business.document.read',
    'business.document.review',
    'business.create_from_application'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'auditor'
  and p.code in (
    'business.application.read_all',
    'business.document.read'
  )
on conflict do nothing;
