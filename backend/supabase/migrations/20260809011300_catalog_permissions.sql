-- Phase 4 catalog / vehicle / discovery permissions
insert into public.permissions (code, description) values
  ('catalog.category.read', 'Read service and product categories'),
  ('business.service.read', 'Read business services'),
  ('business.service.create', 'Create business services'),
  ('business.service.update', 'Update business services'),
  ('business.service.deactivate', 'Deactivate business services'),
  ('business.service.image.manage', 'Manage service images'),
  ('business.product.read', 'Read business products'),
  ('business.product.create', 'Create business products'),
  ('business.product.update', 'Update business products'),
  ('business.product.deactivate', 'Deactivate business products'),
  ('business.product.image.manage', 'Manage product images'),
  ('business.inventory.read', 'Read product inventory'),
  ('business.inventory.adjust', 'Adjust product inventory'),
  ('vehicle.read_own', 'Read own vehicles'),
  ('vehicle.create', 'Create vehicles'),
  ('vehicle.update_own', 'Update own vehicles'),
  ('vehicle.deactivate_own', 'Deactivate own vehicles'),
  ('favorite.read_own', 'Read own favorites'),
  ('favorite.create', 'Create favorites'),
  ('favorite.delete_own', 'Delete own favorites'),
  ('discovery.business.read', 'Discover public businesses'),
  ('discovery.catalog.read', 'Discover public catalog items')
on conflict (code) do nothing;

-- Owner / manager: full catalog + inventory
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('business_owner', 'business_manager')
  and p.code in (
    'catalog.category.read',
    'business.service.read', 'business.service.create', 'business.service.update',
    'business.service.deactivate', 'business.service.image.manage',
    'business.product.read', 'business.product.create', 'business.product.update',
    'business.product.deactivate', 'business.product.image.manage',
    'business.inventory.read', 'business.inventory.adjust',
    'discovery.business.read', 'discovery.catalog.read'
  )
on conflict do nothing;

-- Service advisor: manage services, read products/inventory
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'business_staff'
  and p.code in (
    'catalog.category.read',
    'business.service.read', 'business.product.read', 'business.inventory.read',
    'discovery.business.read', 'discovery.catalog.read'
  )
on conflict do nothing;

-- Customer self-service
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'customer'
  and p.code in (
    'catalog.category.read',
    'vehicle.read_own', 'vehicle.create', 'vehicle.update_own', 'vehicle.deactivate_own',
    'favorite.read_own', 'favorite.create', 'favorite.delete_own',
    'discovery.business.read', 'discovery.catalog.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('admin', 'super_admin')
  and (
    p.code like 'business.service.%'
    or p.code like 'business.product.%'
    or p.code like 'business.inventory.%'
    or p.code like 'vehicle.%'
    or p.code like 'favorite.%'
    or p.code like 'discovery.%'
    or p.code = 'catalog.category.read'
  )
on conflict do nothing;
