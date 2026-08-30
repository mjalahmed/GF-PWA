-- Phase 6: appointment status enum and core tables

do $$ begin
  create type public.appointment_status as enum (
    'requested',
    'confirmed',
    'rejected',
    'customer_arrived',
    'in_progress',
    'completed',
    'cancelled_by_customer',
    'cancelled_by_business',
    'no_show',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  branch_id uuid not null references public.business_branches (id),
  vehicle_id uuid references public.vehicles (id),
  status public.appointment_status not null default 'requested',
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  customer_notes text,
  business_notes text,
  cancellation_reason text,
  cancelled_by uuid references auth.users (id),
  confirmed_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_end_after_start check (scheduled_end > scheduled_start)
);

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id),
  service_name_snapshot text not null,
  estimated_duration_minutes integer not null check (estimated_duration_minutes > 0),
  quoted_price numeric(12, 3),
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references auth.users (id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  visibility text not null default 'internal'
    check (visibility in ('internal', 'customer')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists appointments_business_start_idx
  on public.appointments (business_id, scheduled_start);
create index if not exists appointments_customer_start_idx
  on public.appointments (customer_id, scheduled_start);
create index if not exists appointments_branch_start_idx
  on public.appointments (branch_id, scheduled_start);
create index if not exists appointments_status_idx
  on public.appointments (status);
create index if not exists appointment_services_appointment_id_idx
  on public.appointment_services (appointment_id);
create index if not exists appointment_status_history_appointment_id_idx
  on public.appointment_status_history (appointment_id, created_at);
create index if not exists appointment_notes_appointment_id_idx
  on public.appointment_notes (appointment_id, created_at);

create or replace function public.set_appointments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_appointments_updated_at();
