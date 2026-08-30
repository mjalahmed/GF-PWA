-- Phase 10: dispute permissions

insert into public.permissions (code, description) values
  ('dispute.create', 'Create own disputes'),
  ('dispute.read_own', 'Read own disputes'),
  ('dispute.message_own', 'Message on own disputes'),
  ('dispute.evidence_own', 'Upload evidence on own disputes'),
  ('business.dispute.read', 'Read business disputes'),
  ('business.dispute.respond', 'Respond to business disputes'),
  ('business.dispute.evidence', 'Upload business dispute evidence'),
  ('business.dispute.create', 'Create business-initiated disputes'),
  ('dispute.read_all', 'Read all disputes'),
  ('dispute.assign', 'Assign disputes'),
  ('dispute.request_response', 'Request dispute responses'),
  ('dispute.review', 'Start dispute review'),
  ('dispute.resolve', 'Resolve disputes'),
  ('dispute.reject', 'Reject disputes'),
  ('dispute.close', 'Close disputes'),
  ('dispute.internal_note', 'Add internal dispute notes')
on conflict (code) do nothing;

-- Customer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'dispute.create',
    'dispute.read_own',
    'dispute.message_own',
    'dispute.evidence_own'
  )
on conflict do nothing;

-- Business owner / manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'business.dispute.read',
    'business.dispute.respond',
    'business.dispute.evidence',
    'business.dispute.create'
  )
on conflict do nothing;

-- Staff: read + respond + evidence (not create unless configured)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'business.dispute.read',
    'business.dispute.respond',
    'business.dispute.evidence'
  )
on conflict do nothing;

-- Support / dispute officers
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('support_agent', 'dispute_officer')
  and p.code in (
    'dispute.read_all',
    'dispute.assign',
    'dispute.request_response',
    'dispute.review',
    'dispute.resolve',
    'dispute.reject',
    'dispute.close',
    'dispute.internal_note'
  )
on conflict do nothing;

-- Admins
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'dispute.%'
    or p.code like 'business.dispute.%'
  )
on conflict do nothing;
