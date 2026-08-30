-- Foundation seed: roles, permissions, mappings
-- Codes must match TypeScript Roles / Permissions registries.

insert into public.roles (code, name, description, is_system) values
  ('customer', 'Customer', 'End customer of automotive services', true),
  ('business_owner', 'Business Owner', 'Owner of a registered business', true),
  ('business_manager', 'Business Manager', 'Manager of a registered business', true),
  ('business_staff', 'Business Staff', 'Staff member of a registered business', true),
  ('support_agent', 'Support Agent', 'Customer support agent', true),
  ('onboarding_officer', 'Onboarding Officer', 'Reviews business applications', true),
  ('finance_operator', 'Finance Operator', 'Handles payments and settlements', true),
  ('content_moderator', 'Content Moderator', 'Moderates reviews and content', true),
  ('dispute_officer', 'Dispute Officer', 'Resolves disputes', true),
  ('admin', 'Admin', 'Platform administrator', true),
  ('super_admin', 'Super Admin', 'Full platform access', true),
  ('auditor', 'Auditor', 'Read-only audit access', true)
on conflict (code) do nothing;

insert into public.permissions (code, description) values
  ('profile.read_own', 'Read own profile'),
  ('profile.update_own', 'Update own profile'),
  ('profile.read_all', 'Read all profiles'),
  ('profile.suspend', 'Suspend a profile'),
  ('role.read', 'Read roles'),
  ('role.assign', 'Assign roles to users'),
  ('audit.view', 'View audit logs'),
  ('user.suspend', 'Suspend users'),
  ('business.create', 'Create a business or application'),
  ('business.view', 'View business details'),
  ('business.update', 'Update business profile'),
  ('business.approve', 'Approve a business'),
  ('business.reject', 'Reject a business'),
  ('business.suspend', 'Suspend a business'),
  ('business.restore', 'Restore a suspended business'),
  ('business.application.create', 'Create a business application'),
  ('business.application.read_own', 'Read own business applications'),
  ('business.application.read_all', 'Read all business applications'),
  ('business.application.approve', 'Approve a business application'),
  ('business.application.reject', 'Reject a business application'),
  ('appointment.read', 'Read appointments'),
  ('appointment.create', 'Create appointments'),
  ('appointment.confirm', 'Confirm appointments'),
  ('appointment.reject', 'Reject appointments'),
  ('appointment.cancel', 'Cancel appointments'),
  ('appointment.arrive', 'Mark customer arrived'),
  ('appointment.start', 'Start appointments'),
  ('appointment.complete', 'Complete appointments'),
  ('appointment.no_show', 'Mark appointment no-show'),
  ('appointment.view', 'View appointments (legacy)'),
  ('appointment.manage', 'Manage appointments (legacy)'),
  ('quotation.read_own', 'Read own quotations'),
  ('quotation.accept_own', 'Accept own quotations'),
  ('quotation.reject_own', 'Reject own quotations'),
  ('business.quotation.read', 'Read business quotations'),
  ('business.quotation.create', 'Create business quotations'),
  ('business.quotation.update', 'Update draft quotations'),
  ('business.quotation.issue', 'Issue quotations'),
  ('business.quotation.revise', 'Revise quotations'),
  ('business.quotation.cancel', 'Cancel quotations'),
  ('invoice.create', 'Create invoices'),
  ('invoice.issue', 'Issue invoices'),
  ('invoice.cancel', 'Cancel invoices'),
  ('payment.view', 'View payments'),
  ('refund.create', 'Create refunds'),
  ('refund.approve', 'Approve refunds'),
  ('review.moderate', 'Moderate reviews'),
  ('dispute.resolve', 'Resolve disputes')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'profile.read_own', 'profile.update_own',
    'business.create', 'business.application.create', 'business.application.read_own',
    'business.application.update_own', 'business.application.submit', 'business.application.withdraw',
    'appointment.read', 'appointment.create', 'appointment.cancel',
    'appointment.view', 'payment.view',
    'quotation.read_own', 'quotation.accept_own', 'quotation.reject_own',
    'invoice.read_own', 'invoice.approve_own', 'payment.read_own',
    'review.eligibility.read_own', 'review.create', 'review.read_own',
    'review.update_own', 'review.report', 'review.public.read',
    'dispute.create', 'dispute.read_own', 'dispute.message_own', 'dispute.evidence_own'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'profile.read_own', 'profile.update_own',
    'business.view', 'business.update',
    'appointment.read', 'appointment.confirm', 'appointment.reject',
    'appointment.cancel', 'appointment.arrive', 'appointment.start',
    'appointment.complete', 'appointment.no_show',
    'appointment.view', 'appointment.manage',
    'business.quotation.read', 'business.quotation.create',
    'business.quotation.update', 'business.quotation.issue',
    'business.quotation.revise', 'business.quotation.cancel',
    'invoice.create', 'invoice.issue', 'payment.view',
    'business.invoice.read', 'business.invoice.create',
    'business.invoice.update', 'business.invoice.issue',
    'business.invoice.cancel',
    'business.payment.read', 'business.payment.record_cash',
    'business.review.read', 'business.review.respond', 'review.public.read',
    'business.dispute.read', 'business.dispute.respond',
    'business.dispute.evidence', 'business.dispute.create'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'profile.read_own', 'profile.update_own',
    'appointment.read', 'appointment.arrive', 'appointment.start',
    'appointment.complete', 'appointment.no_show', 'appointment.view',
    'business.quotation.read', 'business.quotation.create',
    'business.quotation.update', 'business.quotation.issue',
    'business.invoice.read', 'business.invoice.create',
    'business.invoice.update', 'business.invoice.issue',
    'business.payment.read', 'business.payment.record_cash',
    'business.review.read', 'review.public.read',
    'business.dispute.read', 'business.dispute.respond', 'business.dispute.evidence'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'onboarding_officer'
  and p.code in (
    'business.view', 'business.approve', 'business.reject',
    'business.application.read_all', 'business.application.approve', 'business.application.reject',
    'business.application.assign_reviewer', 'business.application.start_review',
    'business.application.request_changes', 'business.document.read', 'business.document.review',
    'business.create_from_application',
    'profile.read_all', 'audit.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'super_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'auditor'
  and p.code in ('audit.view', 'business.view', 'payment.view', 'profile.read_all', 'role.read')
on conflict do nothing;


-- Phase 3 business-management permission codes (additive)
insert into public.permissions (code, description) values
  ('business.read', 'Read business internal profile'),
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
