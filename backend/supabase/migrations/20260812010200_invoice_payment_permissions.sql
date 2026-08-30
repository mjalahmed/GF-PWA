-- Phase 8: invoice + payment permissions

insert into public.permissions (code, description) values
  ('invoice.read_own', 'Read own invoices'),
  ('invoice.approve_own', 'Approve own invoices'),
  ('payment.read_own', 'Read own payments'),
  ('business.invoice.read', 'Read business invoices'),
  ('business.invoice.create', 'Create business invoices'),
  ('business.invoice.update', 'Update draft invoices'),
  ('business.invoice.issue', 'Issue invoices'),
  ('business.invoice.cancel', 'Cancel invoices'),
  ('business.payment.read', 'Read business payments'),
  ('business.payment.record_cash', 'Record cash payments'),
  -- reserved / not granted in Phase 8:
  ('business.payment.refund', 'Refund payments (future)'),
  ('business.payment.online_initiate', 'Initiate online payments (future)')
on conflict (code) do nothing;

-- Customer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'invoice.read_own',
    'invoice.approve_own',
    'payment.read_own'
  )
on conflict do nothing;

-- Owner / manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'business.invoice.read',
    'business.invoice.create',
    'business.invoice.update',
    'business.invoice.issue',
    'business.invoice.cancel',
    'business.payment.read',
    'business.payment.record_cash'
  )
on conflict do nothing;

-- Staff (create/update/issue/read invoices + read payments; cash via membership map for cashier/advisor)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'business.invoice.read',
    'business.invoice.create',
    'business.invoice.update',
    'business.invoice.issue',
    'business.payment.read',
    'business.payment.record_cash'
  )
on conflict do nothing;

-- Finance operator: read + cash record
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'finance_operator'
  and p.code in (
    'business.invoice.read',
    'business.payment.read',
    'business.payment.record_cash'
  )
on conflict do nothing;

-- Admins
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'invoice.%'
    or p.code like 'payment.%'
    or p.code like 'business.invoice.%'
    or p.code like 'business.payment.%'
  )
on conflict do nothing;
