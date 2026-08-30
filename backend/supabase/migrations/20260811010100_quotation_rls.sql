-- Phase 7: quotations RLS

alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotation_status_history enable row level security;

create policy quotations_select_own_or_member
  on public.quotations for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('business.quotation.read')
    or public.has_permission('quotation.read_own')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy quotations_service_role_all
  on public.quotations for all to service_role
  using (true) with check (true);

create policy quotation_items_select_via_quotation
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and (
          q.customer_id = auth.uid()
          or public.is_business_member(q.business_id, true)
          or public.has_permission('business.quotation.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy quotation_items_service_role_all
  on public.quotation_items for all to service_role
  using (true) with check (true);

create policy quotation_status_history_select_via_quotation
  on public.quotation_status_history for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and (
          q.customer_id = auth.uid()
          or public.is_business_member(q.business_id, true)
          or public.has_permission('business.quotation.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy quotation_status_history_service_role_all
  on public.quotation_status_history for all to service_role
  using (true) with check (true);

grant select on public.quotations to authenticated;
grant select on public.quotation_items to authenticated;
grant select on public.quotation_status_history to authenticated;

grant select, insert, update, delete on public.quotations to service_role;
grant select, insert, update, delete on public.quotation_items to service_role;
grant select, insert, update, delete on public.quotation_status_history to service_role;
grant usage, select on sequence public.quotation_number_seq to service_role;
