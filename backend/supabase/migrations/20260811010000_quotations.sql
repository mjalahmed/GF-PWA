-- Phase 7: quotation enums, sequence, and tables

do $$ begin
  create type public.quotation_status as enum (
    'draft',
    'issued',
    'viewed',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
    'converted_to_invoice'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.quotation_item_type as enum (
    'service',
    'product',
    'labor',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

create sequence if not exists public.quotation_number_seq;

create or replace function public.next_quotation_number()
returns text
language plpgsql
as $$
declare
  seq bigint;
  yr text;
begin
  seq := nextval('public.quotation_number_seq');
  yr := to_char(timezone('Asia/Bahrain', now()), 'YYYY');
  return 'Q-' || yr || '-' || lpad(seq::text, 6, '0');
end;
$$;

revoke all on function public.next_quotation_number() from public;
grant execute on function public.next_quotation_number() to service_role;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique,
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  branch_id uuid not null references public.business_branches (id),
  vehicle_id uuid references public.vehicles (id),
  appointment_id uuid references public.appointments (id),
  root_quotation_id uuid, -- set to self after insert; soft self-reference
  previous_revision_id uuid references public.quotations (id),
  revision_number integer not null default 1 check (revision_number > 0),
  status public.quotation_status not null default 'draft',
  subtotal numeric(14, 3) not null default 0 check (subtotal >= 0),
  discount_total numeric(14, 3) not null default 0 check (discount_total >= 0),
  tax_total numeric(14, 3) not null default 0 check (tax_total >= 0),
  grand_total numeric(14, 3) not null default 0 check (grand_total >= 0),
  currency text not null default 'BHD' check (currency = 'BHD'),
  valid_until timestamptz,
  customer_message text,
  business_notes text,
  issued_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_totals_coherent check (
    grand_total = round(subtotal - discount_total + tax_total, 3)
  )
);

create or replace function public.set_quotation_root_default()
returns trigger
language plpgsql
as $$
begin
  if new.root_quotation_id is null then
    update public.quotations set root_quotation_id = new.id where id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists quotations_set_root on public.quotations;
create trigger quotations_set_root
  after insert on public.quotations
  for each row execute function public.set_quotation_root_default();
create or replace function public.set_quotations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_quotations_updated_at();

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  item_type public.quotation_item_type not null,
  service_id uuid references public.services (id),
  product_id uuid references public.products (id),
  description text not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 3) not null check (unit_price >= 0),
  discount_amount numeric(14, 3) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(14, 3) not null default 0 check (tax_amount >= 0),
  line_total numeric(14, 3) not null,
  service_name_snapshot text,
  product_name_snapshot text,
  sku_snapshot text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quotation_items_line_total_formula_check check (
    line_total >= 0
    and line_total = round((quantity * unit_price) - discount_amount + tax_amount, 3)
  ),
  constraint quotation_items_discount_lte_base_check check (
    discount_amount <= round(quantity * unit_price, 3)
  ),
  constraint quotation_items_service_link_check check (
    item_type <> 'service' or service_id is not null
  ),
  constraint quotation_items_product_link_check check (
    item_type <> 'product' or product_id is not null
  )
);

create table if not exists public.quotation_status_history (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  from_status public.quotation_status,
  to_status public.quotation_status not null,
  changed_by uuid references auth.users (id),
  note text,
  created_at timestamptz not null default now()
);

-- Lightweight revision lineage index helper (root + revision)
create index if not exists quotations_business_created_idx
  on public.quotations (business_id, created_at desc);
create index if not exists quotations_customer_created_idx
  on public.quotations (customer_id, created_at desc);
create index if not exists quotations_status_idx
  on public.quotations (status);
create index if not exists quotations_root_revision_idx
  on public.quotations (root_quotation_id, revision_number);
create index if not exists quotations_appointment_id_idx
  on public.quotations (appointment_id);
create index if not exists quotation_items_quotation_id_idx
  on public.quotation_items (quotation_id, sort_order);
create index if not exists quotation_status_history_quotation_id_idx
  on public.quotation_status_history (quotation_id, created_at);
