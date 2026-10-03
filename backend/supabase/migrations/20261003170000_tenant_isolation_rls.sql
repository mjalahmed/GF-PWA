-- Tenant isolation: a global permission is not membership in an arbitrary business.
-- Row access is customer ownership, an active membership that holds the
-- permission, or an explicit platform role (admin / super_admin, plus the
-- existing dispute and review moderation roles).

-- ---------------------------------------------------------------------------
-- Membership permission map. Mirrors permissionsForMembershipRole.
-- ---------------------------------------------------------------------------

create or replace function public.membership_role_has_permission(
  p_role text,
  p_permission text
)
returns boolean
language sql
immutable
as $$
  select
    p_role in (
      'owner', 'manager', 'staff', 'service_advisor', 'mechanic', 'cashier', 'receptionist'
    )
    and (
      p_permission = any (array[
        'business.read',
        'business.view',
        'business.branch.read',
        'business.member.read',
        'business.schedule.read',
        'business.public.read',
        'business.settings.read',
        'business.service.read',
        'business.product.read',
        'business.inventory.read',
        'appointment.read',
        'appointment.arrive',
        'appointment.start',
        'appointment.complete',
        'appointment.no_show',
        'appointment.view',
        'business.quotation.read',
        'business.quotation.create',
        'business.quotation.update',
        'business.quotation.issue',
        'business.invoice.read',
        'business.invoice.create',
        'business.invoice.update',
        'business.invoice.issue',
        'business.payment.read',
        'business.review.read',
        'business.dispute.read',
        'business.dispute.respond',
        'business.dispute.evidence'
      ])
      or (
        p_role in ('owner', 'manager')
        and p_permission = any (array[
          'business.update',
          'business.settings.update',
          'business.branch.create',
          'business.branch.update',
          'business.member.invite',
          'business.member.update',
          'business.member.suspend',
          'business.service.create',
          'business.service.update',
          'business.service.deactivate',
          'business.service.image.manage',
          'business.product.create',
          'business.product.update',
          'business.product.deactivate',
          'business.product.image.manage',
          'business.inventory.adjust',
          'appointment.confirm',
          'appointment.reject',
          'appointment.cancel',
          'appointment.manage',
          'business.quotation.revise',
          'business.quotation.cancel',
          'business.invoice.cancel',
          'business.payment.record_cash',
          'business.review.respond',
          'business.dispute.create'
        ])
      )
      or (
        p_role = 'owner'
        and p_permission = any (array[
          'business.schedule.update',
          'business.audit.read',
          'business.branch.delete',
          'business.member.remove',
          'business.member.assign_owner'
        ])
      )
      or (
        p_role in ('cashier', 'service_advisor')
        and p_permission = 'business.payment.record_cash'
      )
    );
$$;

create or replace function public.has_business_permission(
  p_business_id uuid,
  p_permission text,
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
      and m.status = 'active'
      and public.membership_role_has_permission(m.role::text, p_permission)
  );
$$;

revoke all on function public.membership_role_has_permission(text, text) from public;
revoke all on function public.has_business_permission(uuid, text, uuid) from public;
grant execute on function public.membership_role_has_permission(text, text) to authenticated, service_role;
grant execute on function public.has_business_permission(uuid, text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

drop policy if exists appointments_select_own_or_member on public.appointments;
create policy appointments_select_own_or_member
  on public.appointments for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_business_permission(business_id, 'appointment.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists appointment_services_select_via_appointment on public.appointment_services;
create policy appointment_services_select_via_appointment
  on public.appointment_services for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.customer_id = auth.uid()
          or public.has_business_permission(a.business_id, 'appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists appointment_status_history_select_via_appointment on public.appointment_status_history;
create policy appointment_status_history_select_via_appointment
  on public.appointment_status_history for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.customer_id = auth.uid()
          or public.has_business_permission(a.business_id, 'appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists appointment_notes_select_visible on public.appointment_notes;
create policy appointment_notes_select_visible
  on public.appointment_notes for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          (
            a.customer_id = auth.uid()
            and visibility = 'customer'
          )
          or public.has_business_permission(a.business_id, 'appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------

drop policy if exists quotations_select_own_or_member on public.quotations;
create policy quotations_select_own_or_member
  on public.quotations for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_business_permission(business_id, 'business.quotation.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists quotation_items_select_via_quotation on public.quotation_items;
create policy quotation_items_select_via_quotation
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and (
          q.customer_id = auth.uid()
          or public.has_business_permission(q.business_id, 'business.quotation.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists quotation_status_history_select_via_quotation on public.quotation_status_history;
create policy quotation_status_history_select_via_quotation
  on public.quotation_status_history for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and (
          q.customer_id = auth.uid()
          or public.has_business_permission(q.business_id, 'business.quotation.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Invoices and payments
-- ---------------------------------------------------------------------------

drop policy if exists invoices_select_own_or_member on public.invoices;
create policy invoices_select_own_or_member
  on public.invoices for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_business_permission(business_id, 'business.invoice.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists invoice_items_select_via_invoice on public.invoice_items;
create policy invoice_items_select_via_invoice
  on public.invoice_items for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          i.customer_id = auth.uid()
          or public.has_business_permission(i.business_id, 'business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists invoice_status_history_select_via_invoice on public.invoice_status_history;
create policy invoice_status_history_select_via_invoice
  on public.invoice_status_history for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          i.customer_id = auth.uid()
          or public.has_business_permission(i.business_id, 'business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists invoice_adjustments_select_member on public.invoice_adjustments;
create policy invoice_adjustments_select_member
  on public.invoice_adjustments for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          public.has_business_permission(i.business_id, 'business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists payments_select_own_or_member on public.payments;
create policy payments_select_own_or_member
  on public.payments for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_business_permission(business_id, 'business.payment.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists payment_attempts_select_member on public.payment_attempts;
create policy payment_attempts_select_member
  on public.payment_attempts for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (
          public.has_business_permission(p.business_id, 'business.payment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists refunds_select_own_or_member on public.refunds;
create policy refunds_select_own_or_member
  on public.refunds for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (
          p.customer_id = auth.uid()
          or public.has_business_permission(p.business_id, 'business.payment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Disputes. Platform officers keep dispute.read_all / named roles.
-- Customer read_own and business.dispute.read are no longer global ORs.
-- ---------------------------------------------------------------------------

drop policy if exists disputes_select_own_or_member_or_admin on public.disputes;
create policy disputes_select_own_or_member_or_admin
  on public.disputes for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_business_permission(business_id, 'business.dispute.read')
    or public.has_permission('dispute.read_all')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('dispute_officer')
    or public.has_role('support_agent')
  );

drop policy if exists dispute_messages_select_party_or_admin on public.dispute_messages;
create policy dispute_messages_select_party_or_admin
  on public.dispute_messages for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          (
            is_internal = false
            and (
              d.customer_id = auth.uid()
              or public.has_business_permission(d.business_id, 'business.dispute.read')
            )
          )
          or public.has_permission('dispute.read_all')
          or public.has_permission('dispute.internal_note')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

drop policy if exists dispute_evidence_select_party_or_admin on public.dispute_evidence;
create policy dispute_evidence_select_party_or_admin
  on public.dispute_evidence for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.has_business_permission(d.business_id, 'business.dispute.read')
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

drop policy if exists dispute_status_history_select_party_or_admin on public.dispute_status_history;
create policy dispute_status_history_select_party_or_admin
  on public.dispute_status_history for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.has_business_permission(d.business_id, 'business.dispute.read')
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

drop policy if exists dispute_resolution_actions_select_party_or_admin on public.dispute_resolution_actions;
create policy dispute_resolution_actions_select_party_or_admin
  on public.dispute_resolution_actions for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.has_business_permission(d.business_id, 'business.dispute.read')
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
    and action_type <> 'internal_note'
  );

-- Signed uploads are issued by the API after party authorization.
-- A path that merely contains the caller's user id is not an association.
drop policy if exists dispute_evidence_storage_insert_own on storage.objects;

-- ---------------------------------------------------------------------------
-- Catalog, inventory, reviews, memberships
-- ---------------------------------------------------------------------------

drop policy if exists services_select_public_or_member on public.services;
create policy services_select_public_or_member
  on public.services for select to authenticated, anon
  using (
    (
      is_active = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id
          and b.status = 'active'
          and b.verification_status = 'verified'
      )
    )
    or public.has_business_permission(business_id, 'business.service.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists products_select_public_or_member on public.products;
create policy products_select_public_or_member
  on public.products for select to authenticated, anon
  using (
    (
      is_active = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id
          and b.status = 'active'
          and b.verification_status = 'verified'
      )
    )
    or public.has_business_permission(business_id, 'business.product.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists product_inventory_select_member on public.product_inventory;
create policy product_inventory_select_member
  on public.product_inventory for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          public.has_business_permission(p.business_id, 'business.inventory.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists inventory_adjustments_select_member on public.inventory_adjustments;
create policy inventory_adjustments_select_member
  on public.inventory_adjustments for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          public.has_business_permission(p.business_id, 'business.inventory.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists reviews_select_published_or_own_or_member on public.reviews;
create policy reviews_select_published_or_own_or_member
  on public.reviews for select to authenticated
  using (
    status = 'published'
    or customer_id = auth.uid()
    or public.has_business_permission(business_id, 'business.review.read')
    or public.has_permission('review.moderate')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

drop policy if exists business_memberships_select_member_or_self on public.business_memberships;
create policy business_memberships_select_member_or_self
  on public.business_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_business_permission(business_id, 'business.member.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.can_review_business_applications()
    or public.has_role('auditor')
  );

-- ---------------------------------------------------------------------------
-- Global business_owner / manager / staff grants are not a tenant boundary.
-- Customer, admin, super_admin, and onboarding officer grants stay.
-- finance_operator is not consulted by any API route.
-- ---------------------------------------------------------------------------

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.code in ('business_owner', 'business_manager', 'business_staff')
  and (
    p.code like 'business.%'
    or p.code like 'appointment.%'
    or p.code in ('invoice.create', 'invoice.issue', 'payment.view', 'review.public.read')
  );

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.code = 'finance_operator'
  and p.code in (
    'business.invoice.read',
    'business.payment.read',
    'business.payment.record_cash'
  );

-- ---------------------------------------------------------------------------
-- Audit attribution from the mutated row when callers omit business_id.
-- ---------------------------------------------------------------------------

create or replace function public.write_audit_log(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_previous_status text default null,
  p_new_status text default null,
  p_reason text default null,
  p_request_id text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_business_id uuid default null,
  p_branch_id uuid default null,
  p_actor_role text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_business_id uuid := p_business_id;
  v_branch_id uuid := p_branch_id;
  v_actor_role text := nullif(btrim(coalesce(p_actor_role, '')), '');
  v_resolved_business uuid;
  v_resolved_branch uuid;
begin
  if v_business_id is null then
    v_business_id := coalesce(
      public.try_parse_uuid(v_metadata->>'businessId'),
      public.try_parse_uuid(v_metadata->>'business_id'),
      public.try_parse_uuid(p_new_values->>'businessId'),
      public.try_parse_uuid(p_new_values->>'business_id'),
      public.try_parse_uuid(p_old_values->>'businessId'),
      public.try_parse_uuid(p_old_values->>'business_id')
    );
  end if;

  if v_branch_id is null then
    v_branch_id := coalesce(
      public.try_parse_uuid(v_metadata->>'branchId'),
      public.try_parse_uuid(v_metadata->>'branch_id'),
      public.try_parse_uuid(p_new_values->>'branchId'),
      public.try_parse_uuid(p_new_values->>'branch_id'),
      public.try_parse_uuid(p_old_values->>'branchId'),
      public.try_parse_uuid(p_old_values->>'branch_id')
    );
  end if;

  if v_business_id is null and p_entity_id is not null then
    if p_entity_type = 'business' then
      v_resolved_business := p_entity_id;
    elsif p_entity_type = 'invoice' then
      select i.business_id, i.branch_id
      into v_resolved_business, v_resolved_branch
      from public.invoices i
      where i.id = p_entity_id;
    elsif p_entity_type = 'payment' then
      select pay.business_id
      into v_resolved_business
      from public.payments pay
      where pay.id = p_entity_id;
    elsif p_entity_type = 'product_inventory' then
      select prod.business_id, inv.branch_id
      into v_resolved_business, v_resolved_branch
      from public.product_inventory inv
      join public.products prod on prod.id = inv.product_id
      where inv.id = p_entity_id;
    elsif p_entity_type = 'review' then
      select rev.business_id
      into v_resolved_business
      from public.reviews rev
      where rev.id = p_entity_id;
    elsif p_entity_type = 'review_report' then
      select rev.business_id
      into v_resolved_business
      from public.review_reports rr
      join public.reviews rev on rev.id = rr.review_id
      where rr.id = p_entity_id;
    elsif p_entity_type = 'quotation' then
      select q.business_id, q.branch_id
      into v_resolved_business, v_resolved_branch
      from public.quotations q
      where q.id = p_entity_id;
    elsif p_entity_type = 'appointment' then
      select a.business_id, a.branch_id
      into v_resolved_business, v_resolved_branch
      from public.appointments a
      where a.id = p_entity_id;
    end if;

    v_business_id := coalesce(v_business_id, v_resolved_business);
    v_branch_id := coalesce(v_branch_id, v_resolved_branch);
  end if;

  if v_business_id is not null and not exists (
    select 1 from public.businesses b where b.id = v_business_id
  ) then
    v_business_id := null;
  end if;

  if v_actor_role is null and v_business_id is not null and p_actor_user_id is not null then
    select m.role::text
    into v_actor_role
    from public.business_memberships m
    where m.business_id = v_business_id
      and m.user_id = p_actor_user_id
      and m.status = 'active'
    limit 1;
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, action, entity_type, entity_id,
    business_id, branch_id,
    previous_status, new_status, reason, request_id,
    old_values, new_values, metadata
  ) values (
    p_actor_user_id, v_actor_role, p_action, p_entity_type, p_entity_id,
    v_business_id, v_branch_id,
    p_previous_status, p_new_status, p_reason, p_request_id,
    p_old_values, p_new_values, v_metadata
  )
  returning id into log_id;
  return log_id;
end;
$$;

create or replace function public.adjust_product_inventory(
  p_product_id uuid,
  p_branch_id uuid,
  p_adjustment_type public.inventory_adjustment_type,
  p_quantity_delta integer,
  p_actor_user_id uuid,
  p_reason text default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_branch public.business_branches%rowtype;
  v_inv public.product_inventory%rowtype;
  v_prev integer;
  v_new integer;
  v_adj_id uuid;
begin
  if p_adjustment_type not in ('manual_add', 'manual_remove', 'correction') then
    raise exception 'UNSUPPORTED_ADJUSTMENT_TYPE' using errcode = 'P0001';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'ZERO_DELTA' using errcode = 'P0001';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_branch from public.business_branches where id = p_branch_id;
  if not found or v_branch.business_id <> v_product.business_id then
    raise exception 'BRANCH_BUSINESS_MISMATCH' using errcode = 'P0001';
  end if;

  select * into v_inv
  from public.product_inventory
  where product_id = p_product_id and branch_id = p_branch_id
  for update;

  if not found then
    insert into public.product_inventory (product_id, branch_id, quantity_on_hand)
    values (p_product_id, p_branch_id, 0)
    returning * into v_inv;
  end if;

  v_prev := v_inv.quantity_on_hand;

  if p_adjustment_type = 'manual_add' then
    if p_quantity_delta < 0 then raise exception 'INVALID_DELTA' using errcode = 'P0001'; end if;
    v_new := v_prev + p_quantity_delta;
  elsif p_adjustment_type = 'manual_remove' then
    if p_quantity_delta < 0 then raise exception 'INVALID_DELTA' using errcode = 'P0001'; end if;
    v_new := v_prev - p_quantity_delta;
  else
    v_new := v_prev + p_quantity_delta;
  end if;

  if v_new < 0 then
    raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
  end if;

  if v_inv.quantity_reserved > v_new then
    raise exception 'RESERVED_EXCEEDS_ON_HAND' using errcode = 'P0001';
  end if;

  update public.product_inventory
  set quantity_on_hand = v_new, updated_at = timezone('utc', now())
  where id = v_inv.id;

  insert into public.inventory_adjustments (
    product_id, branch_id, adjustment_type, quantity_delta,
    previous_quantity, new_quantity, reason, created_by
  ) values (
    p_product_id, p_branch_id, p_adjustment_type, p_quantity_delta,
    v_prev, v_new, p_reason, p_actor_user_id
  ) returning id into v_adj_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'inventory.adjusted',
    'product_inventory',
    v_inv.id,
    null,
    null,
    p_reason,
    p_request_id,
    jsonb_build_object('quantity_on_hand', v_prev),
    jsonb_build_object(
      'quantity_on_hand', v_new,
      'business_id', v_product.business_id,
      'branch_id', p_branch_id
    ),
    jsonb_build_object(
      'product_id', p_product_id,
      'branch_id', p_branch_id,
      'business_id', v_product.business_id,
      'adjustment_type', p_adjustment_type,
      'adjustment_id', v_adj_id
    ),
    v_product.business_id,
    p_branch_id
  );

  return jsonb_build_object(
    'success', true,
    'inventoryId', v_inv.id,
    'adjustmentId', v_adj_id,
    'previousQuantity', v_prev,
    'newQuantity', v_new
  );
end;
$$;

create or replace function public.recalculate_business_rating(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_avg numeric(3, 2);
begin
  select
    count(*)::integer,
    coalesce(round(avg(overall_rating)::numeric, 2), 0)
  into v_count, v_avg
  from public.reviews
  where business_id = p_business_id
    and status = 'published';

  update public.businesses
  set
    rating_count = v_count,
    average_rating = v_avg
  where id = p_business_id;

  perform public.write_audit_log(
    null,
    'business.rating_recalculated',
    'business',
    p_business_id,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object(
      'rating_count', v_count,
      'average_rating', v_avg,
      'business_id', p_business_id
    ),
    jsonb_build_object('business_id', p_business_id),
    p_business_id
  );
end;
$$;

update public.audit_logs l
set
  business_id = i.business_id,
  branch_id = coalesce(l.branch_id, i.branch_id)
from public.invoices i
where l.business_id is null
  and l.entity_type = 'invoice'
  and l.entity_id = i.id;

update public.audit_logs l
set business_id = pay.business_id
from public.payments pay
where l.business_id is null
  and l.entity_type = 'payment'
  and l.entity_id = pay.id;

update public.audit_logs l
set
  business_id = prod.business_id,
  branch_id = coalesce(l.branch_id, inv.branch_id)
from public.product_inventory inv
join public.products prod on prod.id = inv.product_id
where l.business_id is null
  and l.entity_type = 'product_inventory'
  and l.entity_id = inv.id;

update public.audit_logs l
set business_id = rev.business_id
from public.reviews rev
where l.business_id is null
  and l.entity_type = 'review'
  and l.entity_id = rev.id;

update public.audit_logs l
set business_id = rev.business_id
from public.review_reports rr
join public.reviews rev on rev.id = rr.review_id
where l.business_id is null
  and l.entity_type = 'review_report'
  and l.entity_id = rr.id;

update public.audit_logs l
set business_id = l.entity_id
from public.businesses b
where l.business_id is null
  and l.entity_type = 'business'
  and l.entity_id = b.id;

update public.audit_logs l
set actor_role = m.role::text
from public.business_memberships m
where l.actor_role is null
  and l.business_id is not null
  and l.actor_user_id is not null
  and m.business_id = l.business_id
  and m.user_id = l.actor_user_id
  and m.status = 'active';

-- ---------------------------------------------------------------------------
-- Repair photos. Private bucket. Path: {businessId}/{appointmentId}/{phase}/{file}
-- ---------------------------------------------------------------------------

create table if not exists public.appointment_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  phase text not null check (phase in ('before', 'during', 'after')),
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint appointment_media_path_unique unique (storage_path),
  constraint appointment_media_path_shape check (
    storage_path like business_id::text || '/' || appointment_id::text || '/' || phase || '/%'
    and storage_path not like '%..%'
  )
);

create index if not exists appointment_media_appointment_idx
  on public.appointment_media (appointment_id, phase, sort_order);

alter table public.appointment_media enable row level security;

drop policy if exists appointment_media_select_party on public.appointment_media;
create policy appointment_media_select_party
  on public.appointment_media for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.business_id = business_id
        and (
          a.customer_id = auth.uid()
          or public.has_business_permission(a.business_id, 'appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists appointment_media_service_role_all on public.appointment_media;
create policy appointment_media_service_role_all
  on public.appointment_media for all to service_role
  using (true) with check (true);

grant select on public.appointment_media to authenticated;
grant select, insert, update, delete on public.appointment_media to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-photos',
  'repair-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists repair_photos_select_party on storage.objects;
create policy repair_photos_select_party
  on storage.objects for select to authenticated
  using (
    bucket_id = 'repair-photos'
    and exists (
      select 1 from public.appointments a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and a.business_id = public.try_parse_uuid((storage.foldername(name))[1])
        and (storage.foldername(name))[3] in ('before', 'during', 'after')
        and (
          a.customer_id = auth.uid()
          or public.has_business_permission(a.business_id, 'appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists repair_photos_insert_member on storage.objects;
create policy repair_photos_insert_member
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'repair-photos'
    and exists (
      select 1 from public.appointments a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and a.business_id = public.try_parse_uuid((storage.foldername(name))[1])
        and (storage.foldername(name))[3] in ('before', 'during', 'after')
        and (
          public.has_business_permission(a.business_id, 'appointment.arrive')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists repair_photos_update_member on storage.objects;
create policy repair_photos_update_member
  on storage.objects for update to authenticated
  using (
    bucket_id = 'repair-photos'
    and exists (
      select 1 from public.appointments a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and a.business_id = public.try_parse_uuid((storage.foldername(name))[1])
        and (
          public.has_business_permission(a.business_id, 'appointment.arrive')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  )
  with check (
    bucket_id = 'repair-photos'
    and exists (
      select 1 from public.appointments a
      where a.id = public.try_parse_uuid((storage.foldername(name))[2])
        and a.business_id = public.try_parse_uuid((storage.foldername(name))[1])
        and (storage.foldername(name))[3] in ('before', 'during', 'after')
        and (
          public.has_business_permission(a.business_id, 'appointment.arrive')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

drop policy if exists repair_photos_service_role_all on storage.objects;
create policy repair_photos_service_role_all
  on storage.objects for all to service_role
  using (bucket_id = 'repair-photos')
  with check (bucket_id = 'repair-photos');

-- ---------------------------------------------------------------------------
-- BenefitPay and discovery flags are columns. Client metadata is not a write path.
-- ---------------------------------------------------------------------------

alter table public.business_settings
  add column if not exists benefitpay_enabled boolean not null default false,
  add column if not exists benefitpay_phone text,
  add column if not exists benefitpay_iban text,
  add column if not exists benefitpay_instructions text,
  add column if not exists publicly_visible boolean not null default true,
  add column if not exists accept_new_customers boolean not null default true;

alter table public.business_settings
  drop constraint if exists business_settings_benefitpay_phone_len,
  drop constraint if exists business_settings_benefitpay_iban_len,
  drop constraint if exists business_settings_benefitpay_instructions_len;

alter table public.business_settings
  add constraint business_settings_benefitpay_phone_len
    check (benefitpay_phone is null or char_length(benefitpay_phone) <= 30),
  add constraint business_settings_benefitpay_iban_len
    check (benefitpay_iban is null or char_length(benefitpay_iban) <= 40),
  add constraint business_settings_benefitpay_instructions_len
    check (benefitpay_instructions is null or char_length(benefitpay_instructions) <= 500);
