-- Extended membership helpers for business management
create or replace function public.get_active_business_membership(
  p_business_id uuid,
  p_user_id uuid default auth.uid()
)
returns public.business_memberships
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.business_memberships m
  where m.business_id = p_business_id
    and m.user_id = p_user_id
    and m.status = 'active'
  limit 1;
$$;

create or replace function public.count_active_owners(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.business_memberships m
  where m.business_id = p_business_id
    and m.role = 'owner'
    and m.status = 'active';
$$;

create or replace function public.is_active_business_owner(
  p_business_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships m
    where m.business_id = p_business_id
      and m.user_id = p_user_id
      and m.role = 'owner'
      and m.status = 'active'
  );
$$;

revoke all on function public.get_active_business_membership(uuid, uuid) from public;
revoke all on function public.count_active_owners(uuid) from public;
revoke all on function public.is_active_business_owner(uuid, uuid) from public;
grant execute on function public.get_active_business_membership(uuid, uuid) to authenticated, service_role;
grant execute on function public.count_active_owners(uuid) to authenticated, service_role;
grant execute on function public.is_active_business_owner(uuid, uuid) to authenticated, service_role;
