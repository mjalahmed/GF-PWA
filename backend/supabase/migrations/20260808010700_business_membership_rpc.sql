-- Transactional membership mutations with final-owner protection
create or replace function public.update_business_membership_role(
  p_membership_id uuid,
  p_new_role public.business_membership_role,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.business_memberships%rowtype;
  v_actor public.business_memberships%rowtype;
  v_owner_count integer;
begin
  select * into v_member
  from public.business_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_member.status <> 'active' then
    raise exception 'MEMBERSHIP_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  select * into v_actor
  from public.business_memberships
  where business_id = v_member.business_id
    and user_id = p_actor_user_id
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'ACTOR_NOT_MEMBER' using errcode = 'P0001';
  end if;

  if v_actor.role = 'manager' and (v_member.role = 'owner' or p_new_role = 'owner') then
    raise exception 'MANAGER_CANNOT_MODIFY_OWNER' using errcode = 'P0001';
  end if;

  if p_new_role = 'owner' and v_actor.role <> 'owner' then
    raise exception 'ONLY_OWNER_CAN_ASSIGN_OWNER' using errcode = 'P0001';
  end if;

  if v_member.role = 'owner' and p_new_role <> 'owner' then
    select public.count_active_owners(v_member.business_id) into v_owner_count;
    if v_owner_count <= 1 then
      raise exception 'FINAL_OWNER_PROTECTED' using errcode = 'P0001';
    end if;
  end if;

  if v_member.user_id = p_actor_user_id and v_member.role = 'owner' and p_new_role <> 'owner' then
    select public.count_active_owners(v_member.business_id) into v_owner_count;
    if v_owner_count <= 1 then
      raise exception 'FINAL_OWNER_PROTECTED' using errcode = 'P0001';
    end if;
  end if;

  update public.business_memberships
  set role = p_new_role, updated_at = timezone('utc', now())
  where id = p_membership_id;

  perform public.write_audit_log(
    p_actor_user_id,
    case when p_new_role = 'owner' then 'business.membership.owner_assigned'
         else 'business.membership.role_updated' end,
    'business_membership',
    p_membership_id,
    v_member.role::text,
    p_new_role::text,
    null,
    null,
    jsonb_build_object('role', v_member.role),
    jsonb_build_object(
      'business_id', v_member.business_id,
      'user_id', v_member.user_id,
      'role', p_new_role
    )
  );

  return jsonb_build_object(
    'success', true,
    'membershipId', p_membership_id,
    'previousRole', v_member.role,
    'newRole', p_new_role
  );
end;
$$;

create or replace function public.suspend_business_membership(
  p_membership_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.business_memberships%rowtype;
  v_actor public.business_memberships%rowtype;
begin
  select * into v_member from public.business_memberships where id = p_membership_id for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_member.status <> 'active' then raise exception 'MEMBERSHIP_NOT_ACTIVE' using errcode = 'P0001'; end if;

  select * into v_actor
  from public.business_memberships
  where business_id = v_member.business_id and user_id = p_actor_user_id and status = 'active'
  limit 1;
  if not found then raise exception 'ACTOR_NOT_MEMBER' using errcode = 'P0001'; end if;

  if v_member.role = 'owner' then
    if public.count_active_owners(v_member.business_id) <= 1 then
      raise exception 'FINAL_OWNER_PROTECTED' using errcode = 'P0001';
    end if;
    if v_actor.role <> 'owner' then
      raise exception 'ONLY_OWNER_CAN_MODIFY_OWNER' using errcode = 'P0001';
    end if;
  elsif v_actor.role not in ('owner', 'manager') then
    raise exception 'PERMISSION_DENIED' using errcode = 'P0001';
  end if;

  update public.business_memberships
  set status = 'suspended', suspended_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = p_membership_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'business.membership.suspended',
    'business_membership',
    p_membership_id,
    'active',
    'suspended',
    null,
    null,
    null,
    jsonb_build_object('business_id', v_member.business_id, 'user_id', v_member.user_id)
  );

  return jsonb_build_object('success', true, 'membershipId', p_membership_id);
end;
$$;

create or replace function public.restore_business_membership(
  p_membership_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.business_memberships%rowtype;
  v_actor public.business_memberships%rowtype;
begin
  select * into v_member from public.business_memberships where id = p_membership_id for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_member.status <> 'suspended' then raise exception 'MEMBERSHIP_NOT_SUSPENDED' using errcode = 'P0001'; end if;

  select * into v_actor
  from public.business_memberships
  where business_id = v_member.business_id and user_id = p_actor_user_id and status = 'active'
  limit 1;
  if not found then raise exception 'ACTOR_NOT_MEMBER' using errcode = 'P0001'; end if;
  if v_actor.role not in ('owner', 'manager') then
    raise exception 'PERMISSION_DENIED' using errcode = 'P0001';
  end if;
  if v_member.role = 'owner' and v_actor.role <> 'owner' then
    raise exception 'ONLY_OWNER_CAN_MODIFY_OWNER' using errcode = 'P0001';
  end if;

  -- Ensure no conflicting active membership for same user
  if exists (
    select 1 from public.business_memberships
    where business_id = v_member.business_id
      and user_id = v_member.user_id
      and status = 'active'
      and id <> v_member.id
  ) then
    raise exception 'ACTIVE_MEMBERSHIP_EXISTS' using errcode = 'P0001';
  end if;

  update public.business_memberships
  set status = 'active', suspended_at = null, updated_at = timezone('utc', now())
  where id = p_membership_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'business.membership.restored',
    'business_membership',
    p_membership_id,
    'suspended',
    'active',
    null,
    null,
    null,
    jsonb_build_object('business_id', v_member.business_id, 'user_id', v_member.user_id)
  );

  return jsonb_build_object('success', true, 'membershipId', p_membership_id);
end;
$$;

create or replace function public.remove_business_membership(
  p_membership_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.business_memberships%rowtype;
  v_actor public.business_memberships%rowtype;
begin
  select * into v_member from public.business_memberships where id = p_membership_id for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_member.status = 'removed' then
    return jsonb_build_object('success', true, 'idempotent', true, 'membershipId', p_membership_id);
  end if;

  select * into v_actor
  from public.business_memberships
  where business_id = v_member.business_id and user_id = p_actor_user_id and status = 'active'
  limit 1;
  if not found then raise exception 'ACTOR_NOT_MEMBER' using errcode = 'P0001'; end if;

  if v_member.role = 'owner' then
    if public.count_active_owners(v_member.business_id) <= 1 and v_member.status = 'active' then
      raise exception 'FINAL_OWNER_PROTECTED' using errcode = 'P0001';
    end if;
    if v_actor.role <> 'owner' then
      raise exception 'ONLY_OWNER_CAN_MODIFY_OWNER' using errcode = 'P0001';
    end if;
  elsif v_actor.role not in ('owner', 'manager') then
    raise exception 'PERMISSION_DENIED' using errcode = 'P0001';
  end if;

  update public.business_memberships
  set status = 'removed', removed_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = p_membership_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'business.membership.removed',
    'business_membership',
    p_membership_id,
    v_member.status::text,
    'removed',
    null,
    null,
    null,
    jsonb_build_object('business_id', v_member.business_id, 'user_id', v_member.user_id)
  );

  return jsonb_build_object('success', true, 'idempotent', false, 'membershipId', p_membership_id);
end;
$$;

create or replace function public.accept_business_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.business_invitations%rowtype;
  v_membership_id uuid;
begin
  select * into v_invite
  from public.business_invitations
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'INVITATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_invite.status = 'revoked' then
    raise exception 'INVITATION_REVOKED' using errcode = 'P0001';
  end if;

  if v_invite.status = 'accepted' then
    raise exception 'INVITATION_ALREADY_ACCEPTED' using errcode = 'P0001';
  end if;

  if v_invite.expires_at <= timezone('utc', now()) then
    update public.business_invitations
    set status = 'expired', updated_at = timezone('utc', now())
    where id = v_invite.id;
    raise exception 'INVITATION_EXPIRED' using errcode = 'P0001';
  end if;

  if lower(btrim(v_invite.email)) <> lower(btrim(p_user_email)) then
    raise exception 'INVITATION_EMAIL_MISMATCH' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.business_memberships
    where business_id = v_invite.business_id
      and user_id = p_user_id
      and status = 'active'
  ) then
    raise exception 'ALREADY_ACTIVE_MEMBER' using errcode = 'P0001';
  end if;

  insert into public.business_memberships (
    business_id, user_id, role, status, invited_by, invited_at, accepted_at
  ) values (
    v_invite.business_id,
    p_user_id,
    v_invite.membership_role,
    'active',
    v_invite.invited_by,
    v_invite.created_at,
    timezone('utc', now())
  )
  returning id into v_membership_id;

  update public.business_invitations
  set
    status = 'accepted',
    accepted_by = p_user_id,
    accepted_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = v_invite.id;

  perform public.write_audit_log(
    p_user_id,
    'business.invitation.accepted',
    'business_invitation',
    v_invite.id,
    'pending',
    'accepted',
    null,
    null,
    null,
    jsonb_build_object(
      'business_id', v_invite.business_id,
      'membership_id', v_membership_id,
      'role', v_invite.membership_role
    )
  );

  return jsonb_build_object(
    'success', true,
    'invitationId', v_invite.id,
    'membershipId', v_membership_id,
    'businessId', v_invite.business_id,
    'role', v_invite.membership_role
  );
end;
$$;

revoke all on function public.update_business_membership_role(uuid, public.business_membership_role, uuid) from public;
revoke all on function public.suspend_business_membership(uuid, uuid) from public;
revoke all on function public.restore_business_membership(uuid, uuid) from public;
revoke all on function public.remove_business_membership(uuid, uuid) from public;
revoke all on function public.accept_business_invitation(text, uuid, text) from public;
grant execute on function public.update_business_membership_role(uuid, public.business_membership_role, uuid) to service_role;
grant execute on function public.suspend_business_membership(uuid, uuid) to service_role;
grant execute on function public.restore_business_membership(uuid, uuid) to service_role;
grant execute on function public.remove_business_membership(uuid, uuid) to service_role;
grant execute on function public.accept_business_invitation(text, uuid, text) to service_role;
