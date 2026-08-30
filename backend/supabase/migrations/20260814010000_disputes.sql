-- Phase 10: dispute workflow schema

do $$ begin
  create type public.dispute_status as enum (
    'opened',
    'awaiting_business',
    'awaiting_customer',
    'under_review',
    'resolved',
    'rejected',
    'closed',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dispute_actor_type as enum (
    'customer',
    'business',
    'admin',
    'system'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dispute_reason_code as enum (
    'service_not_completed',
    'service_quality',
    'unexpected_charge',
    'pricing_dispute',
    'incorrect_invoice',
    'payment_issue',
    'business_no_show',
    'customer_no_show',
    'appointment_issue',
    'quotation_issue',
    'review_issue',
    'damage_claim',
    'communication_issue',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dispute_resolution_code as enum (
    'customer_supported',
    'business_supported',
    'mutual_resolution',
    'insufficient_evidence',
    'policy_violation_customer',
    'policy_violation_business',
    'duplicate',
    'invalid_dispute',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dispute_resolution_action_type as enum (
    'assigned',
    'requested_customer_response',
    'requested_business_response',
    'marked_under_review',
    'resolved',
    'rejected',
    'closed',
    'reopened',
    'withdrawn',
    'internal_note'
  );
exception when duplicate_object then null;
end $$;

create sequence if not exists public.dispute_number_seq;

create or replace function public.next_dispute_number()
returns text
language plpgsql
as $$
declare
  seq bigint;
  yr text;
begin
  seq := nextval('public.dispute_number_seq');
  yr := to_char(timezone('Asia/Bahrain', now()), 'YYYY');
  return 'DSP-' || yr || '-' || lpad(seq::text, 6, '0');
end;
$$;

revoke all on function public.next_dispute_number() from public;
grant execute on function public.next_dispute_number() to service_role;

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_number text not null unique,
  opened_by uuid not null references auth.users (id),
  opened_by_type public.dispute_actor_type not null,
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  appointment_id uuid references public.appointments (id),
  quotation_id uuid references public.quotations (id),
  invoice_id uuid references public.invoices (id),
  payment_id uuid references public.payments (id),
  review_id uuid references public.reviews (id),
  reason_code public.dispute_reason_code not null,
  summary text not null check (char_length(summary) between 1 and 500),
  description text check (description is null or char_length(description) <= 5000),
  status public.dispute_status not null default 'opened',
  assigned_admin_id uuid references auth.users (id),
  resolution_code public.dispute_resolution_code,
  resolution_summary text check (resolution_summary is null or char_length(resolution_summary) <= 5000),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 10000),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disputes_has_source_check check (
    appointment_id is not null
    or quotation_id is not null
    or invoice_id is not null
    or payment_id is not null
    or review_id is not null
  )
);

create index if not exists disputes_customer_status_idx
  on public.disputes (customer_id, status, created_at desc);
create index if not exists disputes_business_status_idx
  on public.disputes (business_id, status, created_at desc);
create index if not exists disputes_assigned_admin_idx
  on public.disputes (assigned_admin_id, status)
  where assigned_admin_id is not null;
create index if not exists disputes_invoice_id_idx
  on public.disputes (invoice_id) where invoice_id is not null;
create index if not exists disputes_appointment_id_idx
  on public.disputes (appointment_id) where appointment_id is not null;

-- One active dispute per invoice (when invoice-linked)
create unique index if not exists disputes_active_invoice_uidx
  on public.disputes (invoice_id)
  where invoice_id is not null
    and status not in ('resolved', 'rejected', 'closed', 'withdrawn');

create unique index if not exists disputes_active_appointment_uidx
  on public.disputes (appointment_id)
  where appointment_id is not null
    and invoice_id is null
    and status not in ('resolved', 'rejected', 'closed', 'withdrawn');

create unique index if not exists disputes_active_payment_uidx
  on public.disputes (payment_id)
  where payment_id is not null
    and invoice_id is null
    and status not in ('resolved', 'rejected', 'closed', 'withdrawn');

create unique index if not exists disputes_active_review_uidx
  on public.disputes (review_id)
  where review_id is not null
    and status not in ('resolved', 'rejected', 'closed', 'withdrawn');

create unique index if not exists disputes_active_quotation_uidx
  on public.disputes (quotation_id)
  where quotation_id is not null
    and invoice_id is null
    and appointment_id is null
    and status not in ('resolved', 'rejected', 'closed', 'withdrawn');

create or replace function public.set_disputes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
  before update on public.disputes
  for each row execute function public.set_disputes_updated_at();

create table if not exists public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id),
  sender_type public.dispute_actor_type not null,
  message text not null check (char_length(message) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists dispute_messages_dispute_id_idx
  on public.dispute_messages (dispute_id, created_at);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id),
  uploader_type public.dispute_actor_type not null,
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  description text check (description is null or char_length(description) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists dispute_evidence_dispute_id_idx
  on public.dispute_evidence (dispute_id, created_at);

create table if not exists public.dispute_status_history (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  previous_status public.dispute_status,
  new_status public.dispute_status not null,
  changed_by uuid references auth.users (id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dispute_status_history_dispute_id_idx
  on public.dispute_status_history (dispute_id, created_at);

create table if not exists public.dispute_resolution_actions (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  action_type public.dispute_resolution_action_type not null,
  performed_by uuid not null references auth.users (id),
  resolution_code public.dispute_resolution_code,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dispute_resolution_actions_dispute_id_idx
  on public.dispute_resolution_actions (dispute_id, created_at);
