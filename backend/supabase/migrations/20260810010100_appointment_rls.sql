-- Phase 6: appointments RLS

alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.appointment_notes enable row level security;

create policy appointments_select_own_or_member
  on public.appointments for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('appointment.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

-- Mutations go through service_role after API authorization
create policy appointments_service_role_all
  on public.appointments for all to service_role
  using (true) with check (true);

create policy appointment_services_select_via_appointment
  on public.appointment_services for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.customer_id = auth.uid()
          or public.is_business_member(a.business_id, true)
          or public.has_permission('appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy appointment_services_service_role_all
  on public.appointment_services for all to service_role
  using (true) with check (true);

create policy appointment_status_history_select_via_appointment
  on public.appointment_status_history for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.customer_id = auth.uid()
          or public.is_business_member(a.business_id, true)
          or public.has_permission('appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy appointment_status_history_service_role_all
  on public.appointment_status_history for all to service_role
  using (true) with check (true);

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
          or public.is_business_member(a.business_id, true)
          or public.has_permission('appointment.read')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy appointment_notes_service_role_all
  on public.appointment_notes for all to service_role
  using (true) with check (true);

grant select on public.appointments to authenticated;
grant select on public.appointment_services to authenticated;
grant select on public.appointment_status_history to authenticated;
grant select on public.appointment_notes to authenticated;

grant select, insert, update, delete on public.appointments to service_role;
grant select, insert, update, delete on public.appointment_services to service_role;
grant select, insert, update, delete on public.appointment_status_history to service_role;
grant select, insert, update, delete on public.appointment_notes to service_role;
