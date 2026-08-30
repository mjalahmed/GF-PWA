-- Phase 6: granular appointment permissions

insert into public.permissions (code, description) values
  ('appointment.read', 'Read appointments'),
  ('appointment.create', 'Create appointments'),
  ('appointment.confirm', 'Confirm appointments'),
  ('appointment.reject', 'Reject appointments'),
  ('appointment.cancel', 'Cancel appointments'),
  ('appointment.arrive', 'Mark customer arrived'),
  ('appointment.start', 'Start appointments'),
  ('appointment.complete', 'Complete appointments'),
  ('appointment.no_show', 'Mark appointment no-show'),
  -- legacy aliases retained for older seeds
  ('appointment.view', 'View appointments (legacy)'),
  ('appointment.manage', 'Manage appointments (legacy)')
on conflict (code) do nothing;

-- Customer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'appointment.read',
    'appointment.create',
    'appointment.cancel',
    'appointment.view'
  )
on conflict do nothing;

-- Business owner / manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'appointment.read',
    'appointment.confirm',
    'appointment.reject',
    'appointment.cancel',
    'appointment.arrive',
    'appointment.start',
    'appointment.complete',
    'appointment.no_show',
    'appointment.view',
    'appointment.manage'
  )
on conflict do nothing;

-- Staff: read + operational transitions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'appointment.read',
    'appointment.arrive',
    'appointment.start',
    'appointment.complete',
    'appointment.no_show',
    'appointment.view'
  )
on conflict do nothing;

-- Admins
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'appointment.%'
  )
on conflict do nothing;
