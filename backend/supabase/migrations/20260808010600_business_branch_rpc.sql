-- Transactional primary-branch switch
create or replace function public.make_business_branch_primary(
  p_business_id uuid,
  p_branch_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch public.business_branches%rowtype;
  v_previous_primary uuid;
begin
  select *
  into v_branch
  from public.business_branches
  where id = p_branch_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'BRANCH_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_branch.is_active is not true then
    raise exception 'BRANCH_INACTIVE' using errcode = 'P0001';
  end if;

  select id into v_previous_primary
  from public.business_branches
  where business_id = p_business_id
    and is_primary = true
    and is_active = true
    and id <> p_branch_id
  limit 1;

  update public.business_branches
  set is_primary = false, updated_at = timezone('utc', now())
  where business_id = p_business_id
    and is_primary = true
    and id <> p_branch_id;

  update public.business_branches
  set is_primary = true, updated_at = timezone('utc', now())
  where id = p_branch_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'business.branch.primary_changed',
    'business_branch',
    p_branch_id,
    null,
    null,
    null,
    null,
    jsonb_build_object('previous_primary_branch_id', v_previous_primary),
    jsonb_build_object('business_id', p_business_id, 'branch_id', p_branch_id)
  );

  return jsonb_build_object(
    'success', true,
    'branchId', p_branch_id,
    'previousPrimaryBranchId', v_previous_primary
  );
end;
$$;

-- Soft-deactivate branch with guards
create or replace function public.deactivate_business_branch(
  p_business_id uuid,
  p_branch_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch public.business_branches%rowtype;
  v_active_count integer;
begin
  select *
  into v_branch
  from public.business_branches
  where id = p_branch_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'BRANCH_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_branch.is_active is not true then
    return jsonb_build_object('success', true, 'idempotent', true, 'branchId', p_branch_id);
  end if;

  select count(*)::integer into v_active_count
  from public.business_branches
  where business_id = p_business_id
    and is_active = true;

  if v_active_count <= 1 then
    raise exception 'LAST_ACTIVE_BRANCH' using errcode = 'P0001';
  end if;

  if v_branch.is_primary then
    raise exception 'PRIMARY_BRANCH_REQUIRES_REASSIGNMENT' using errcode = 'P0001';
  end if;

  update public.business_branches
  set is_active = false, updated_at = timezone('utc', now())
  where id = p_branch_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'business.branch.deactivated',
    'business_branch',
    p_branch_id,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object('business_id', p_business_id)
  );

  return jsonb_build_object('success', true, 'idempotent', false, 'branchId', p_branch_id);
end;
$$;

revoke all on function public.make_business_branch_primary(uuid, uuid, uuid) from public;
revoke all on function public.deactivate_business_branch(uuid, uuid, uuid) from public;
grant execute on function public.make_business_branch_primary(uuid, uuid, uuid) to service_role;
grant execute on function public.deactivate_business_branch(uuid, uuid, uuid) to service_role;
