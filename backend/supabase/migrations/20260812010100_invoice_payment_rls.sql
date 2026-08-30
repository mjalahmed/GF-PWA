-- Phase 8: invoice + payment RLS (select for authenticated; mutations via service_role/RPC)

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_status_history enable row level security;
alter table public.invoice_adjustments enable row level security;
alter table public.payments enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;

-- Invoices
create policy invoices_select_own_or_member
  on public.invoices for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('business.invoice.read')
    or public.has_permission('invoice.read_own')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy invoices_service_role_all
  on public.invoices for all to service_role
  using (true) with check (true);

-- Invoice items
create policy invoice_items_select_via_invoice
  on public.invoice_items for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          i.customer_id = auth.uid()
          or public.is_business_member(i.business_id, true)
          or public.has_permission('business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy invoice_items_service_role_all
  on public.invoice_items for all to service_role
  using (true) with check (true);

-- Invoice status history
create policy invoice_status_history_select_via_invoice
  on public.invoice_status_history for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          i.customer_id = auth.uid()
          or public.is_business_member(i.business_id, true)
          or public.has_permission('business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy invoice_status_history_service_role_all
  on public.invoice_status_history for all to service_role
  using (true) with check (true);

-- Adjustments: business members / admins only (foundation; no customer access)
create policy invoice_adjustments_select_member
  on public.invoice_adjustments for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          public.is_business_member(i.business_id, true)
          or public.has_permission('business.invoice.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy invoice_adjustments_service_role_all
  on public.invoice_adjustments for all to service_role
  using (true) with check (true);

-- Payments
create policy payments_select_own_or_member
  on public.payments for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('business.payment.read')
    or public.has_permission('payment.read_own')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy payments_service_role_all
  on public.payments for all to service_role
  using (true) with check (true);

-- Payment attempts: business members / admins only (no raw customer exposure of internals)
create policy payment_attempts_select_member
  on public.payment_attempts for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (
          public.is_business_member(p.business_id, true)
          or public.has_permission('business.payment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy payment_attempts_service_role_all
  on public.payment_attempts for all to service_role
  using (true) with check (true);

-- Payment events: service role + privileged admins only (no ordinary client access)
create policy payment_events_select_admin
  on public.payment_events for select to authenticated
  using (
    public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy payment_events_service_role_all
  on public.payment_events for all to service_role
  using (true) with check (true);

-- Refunds: schema-ready; no client mutations; select for related parties
create policy refunds_select_own_or_member
  on public.refunds for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (
          p.customer_id = auth.uid()
          or public.is_business_member(p.business_id, true)
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy refunds_service_role_all
  on public.refunds for all to service_role
  using (true) with check (true);

grant select on public.invoices to authenticated;
grant select on public.invoice_items to authenticated;
grant select on public.invoice_status_history to authenticated;
grant select on public.invoice_adjustments to authenticated;
grant select on public.payments to authenticated;
grant select on public.payment_attempts to authenticated;
grant select on public.payment_events to authenticated;
grant select on public.refunds to authenticated;

grant select, insert, update, delete on public.invoices to service_role;
grant select, insert, update, delete on public.invoice_items to service_role;
grant select, insert, update, delete on public.invoice_status_history to service_role;
grant select, insert, update, delete on public.invoice_adjustments to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select, insert, update, delete on public.payment_attempts to service_role;
grant select, insert, update, delete on public.payment_events to service_role;
grant select, insert, update, delete on public.refunds to service_role;

grant usage, select on sequence public.invoice_number_seq to service_role;
grant usage, select on sequence public.payment_reference_seq to service_role;
