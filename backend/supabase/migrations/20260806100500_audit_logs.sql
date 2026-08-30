-- Append-only audit logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_status text,
  new_status text,
  reason text,
  request_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_actor_created_idx on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_action_idx on public.audit_logs (action);
create index audit_logs_request_id_idx on public.audit_logs (request_id);

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
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
begin
  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id,
    previous_status, new_status, reason, request_id,
    old_values, new_values, metadata
  ) values (
    p_actor_user_id, p_action, p_entity_type, p_entity_id,
    p_previous_status, p_new_status, p_reason, p_request_id,
    p_old_values, p_new_values, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into log_id;
  return log_id;
end;
$$;

revoke all on function public.write_audit_log(
  uuid, text, text, uuid, text, text, text, text, jsonb, jsonb, jsonb
) from public;
grant execute on function public.write_audit_log(
  uuid, text, text, uuid, text, text, text, text, jsonb, jsonb, jsonb
) to service_role;
