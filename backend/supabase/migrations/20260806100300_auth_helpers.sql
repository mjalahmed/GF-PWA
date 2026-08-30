-- Authorization helpers (security definer)
create or replace function public.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = role_code
  );
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.code = permission_code
  )
  or public.has_role('super_admin');
$$;

create or replace function public.get_user_roles(target_user_id uuid default auth.uid())
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(r.code order by r.code),
    '{}'::text[]
  )
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = coalesce(target_user_id, auth.uid())
    and (
      auth.role() = 'service_role'
      or ur.user_id = auth.uid()
      or public.has_permission('role.assign')
      or public.has_permission('audit.view')
      or public.has_role('super_admin')
    );
$$;

create or replace function public.get_user_permissions(target_user_id uuid default auth.uid())
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(distinct p.code order by p.code),
    '{}'::text[]
  )
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = coalesce(target_user_id, auth.uid())
    and (
      auth.role() = 'service_role'
      or ur.user_id = auth.uid()
      or public.has_permission('role.assign')
      or public.has_permission('audit.view')
      or public.has_role('super_admin')
    );
$$;

revoke all on function public.has_role(text) from public;
revoke all on function public.has_permission(text) from public;
revoke all on function public.get_user_roles(uuid) from public;
revoke all on function public.get_user_permissions(uuid) from public;
grant execute on function public.has_role(text) to authenticated, service_role;
grant execute on function public.has_permission(text) to authenticated, service_role;
grant execute on function public.get_user_roles(uuid) to authenticated, service_role;
grant execute on function public.get_user_permissions(uuid) to authenticated, service_role;
