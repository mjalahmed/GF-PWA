-- Idempotency records for sensitive POST operations
create table public.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  operation text not null,
  request_hash text not null,
  response_status integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique (user_id, operation, idempotency_key)
);

create index idempotency_records_expires_at_idx
  on public.idempotency_records (expires_at);
create index idempotency_records_user_operation_idx
  on public.idempotency_records (user_id, operation);
