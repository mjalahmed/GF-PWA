-- Phase 7: quotation permissions

insert into public.permissions (code, description) values
  ('quotation.read_own', 'Read own quotations'),
  ('quotation.accept_own', 'Accept own quotations'),
  ('quotation.reject_own', 'Reject own quotations'),
  ('business.quotation.read', 'Read business quotations'),
  ('business.quotation.create', 'Create business quotations'),
  ('business.quotation.update', 'Update draft quotations'),
  ('business.quotation.issue', 'Issue quotations'),
  ('business.quotation.revise', 'Revise quotations'),
  ('business.quotation.cancel', 'Cancel quotations')
on conflict (code) do nothing;

-- Customer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'quotation.read_own',
    'quotation.accept_own',
    'quotation.reject_own'
  )
on conflict do nothing;

-- Owner / manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'business.quotation.read',
    'business.quotation.create',
    'business.quotation.update',
    'business.quotation.issue',
    'business.quotation.revise',
    'business.quotation.cancel'
  )
on conflict do nothing;

-- Staff / service advisor style: create/update/issue/read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'business.quotation.read',
    'business.quotation.create',
    'business.quotation.update',
    'business.quotation.issue'
  )
on conflict do nothing;

-- Admins
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'quotation.%'
    or p.code like 'business.quotation.%'
  )
on conflict do nothing;
