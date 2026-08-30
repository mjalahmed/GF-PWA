-- RLS policies and grants for foundation tables
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.idempotency_records enable row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.has_permission('user.suspend')
    or public.has_permission('audit.view')
    or public.has_role('super_admin')
  );

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (
    id = auth.uid()
    or public.has_permission('user.suspend')
    or public.has_role('super_admin')
  )
  with check (
    id = auth.uid()
    or public.has_permission('user.suspend')
    or public.has_role('super_admin')
  );

create policy roles_select_authenticated
  on public.roles for select to authenticated
  using (true);

create policy permissions_select_authenticated
  on public.permissions for select to authenticated
  using (true);

create policy role_permissions_select_authenticated
  on public.role_permissions for select to authenticated
  using (true);

create policy user_roles_select_own_or_admin
  on public.user_roles for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_permission('role.assign')
    or public.has_permission('audit.view')
    or public.has_role('super_admin')
  );

create policy audit_logs_select
  on public.audit_logs for select to authenticated
  using (
    public.has_permission('audit.view')
    or public.has_role('super_admin')
  );

-- idempotency_records: no client access (service role only)

grant usage on schema public to anon, authenticated, service_role;

grant select on public.roles to authenticated, service_role;
grant select on public.permissions to authenticated, service_role;
grant select on public.role_permissions to authenticated, service_role;
grant select, update on public.profiles to authenticated, service_role;
grant select on public.user_roles to authenticated, service_role;
grant select on public.audit_logs to authenticated, service_role;

grant insert, update, delete on public.roles to service_role;
grant insert, update, delete on public.permissions to service_role;
grant insert, update, delete on public.role_permissions to service_role;
grant insert, update, delete on public.user_roles to service_role;
grant insert, delete on public.profiles to service_role;
grant insert on public.audit_logs to service_role;
grant select, insert, update, delete on public.idempotency_records to service_role;
