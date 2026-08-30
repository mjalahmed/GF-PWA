-- Phase 8: invoice + payment enums, sequences, tables, and financial RPCs

do $$ begin
  create type public.invoice_status as enum (
    'draft',
    'issued',
    'viewed',
    'customer_approved',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled',
    'partially_refunded',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_item_type as enum (
    'service',
    'product',
    'labor',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_adjustment_type as enum (
    'discount',
    'credit',
    'debit',
    'correction'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum (
    'cash',
    'card',
    'benefit',
    'benefitpay',
    'apple_pay',
    'bank_transfer',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum (
    'created',
    'pending',
    'requires_action',
    'authorized',
    'captured',
    'failed',
    'cancelled',
    'expired',
    'partially_refunded',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.refund_status as enum (
    'pending',
    'succeeded',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create sequence if not exists public.invoice_number_seq;
create sequence if not exists public.payment_reference_seq;

create or replace function public.next_invoice_number()
returns text
language plpgsql
as $$
declare
  seq bigint;
  yr text;
begin
  seq := nextval('public.invoice_number_seq');
  yr := to_char(timezone('Asia/Bahrain', now()), 'YYYY');
  return 'INV-' || yr || '-' || lpad(seq::text, 6, '0');
end;
$$;

revoke all on function public.next_invoice_number() from public;
grant execute on function public.next_invoice_number() to service_role;

create or replace function public.next_payment_reference()
returns text
language plpgsql
as $$
declare
  seq bigint;
  yr text;
begin
  seq := nextval('public.payment_reference_seq');
  yr := to_char(timezone('Asia/Bahrain', now()), 'YYYY');
  return 'PAY-' || yr || '-' || lpad(seq::text, 6, '0');
end;
$$;

revoke all on function public.next_payment_reference() from public;
grant execute on function public.next_payment_reference() to service_role;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  branch_id uuid not null references public.business_branches (id),
  vehicle_id uuid references public.vehicles (id),
  appointment_id uuid references public.appointments (id),
  quotation_id uuid references public.quotations (id),
  status public.invoice_status not null default 'draft',
  subtotal numeric(14, 3) not null default 0 check (subtotal >= 0),
  discount_total numeric(14, 3) not null default 0 check (discount_total >= 0),
  tax_total numeric(14, 3) not null default 0 check (tax_total >= 0),
  platform_fee_total numeric(14, 3) not null default 0 check (platform_fee_total >= 0),
  grand_total numeric(14, 3) not null default 0 check (grand_total >= 0),
  paid_total numeric(14, 3) not null default 0 check (paid_total >= 0),
  remaining_total numeric(14, 3) not null check (remaining_total >= 0),
  currency text not null default 'BHD' check (currency = 'BHD'),
  requires_customer_approval boolean not null default false,
  due_at timestamptz,
  issued_at timestamptz,
  viewed_at timestamptz,
  customer_approved_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references auth.users (id),
  customer_message text,
  business_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_paid_lte_grand check (paid_total <= grand_total),
  constraint invoices_remaining_coherent check (
    remaining_total = round(grand_total - paid_total, 3)
  ),
  constraint invoices_totals_coherent check (
    grand_total = round(subtotal - discount_total + tax_total + platform_fee_total, 3)
  )
);

create unique index if not exists invoices_quotation_id_unique_idx
  on public.invoices (quotation_id)
  where quotation_id is not null;

create index if not exists invoices_customer_id_created_at_idx
  on public.invoices (customer_id, created_at desc);

create index if not exists invoices_business_id_status_idx
  on public.invoices (business_id, status);

create index if not exists invoices_appointment_id_idx
  on public.invoices (appointment_id)
  where appointment_id is not null;

create or replace function public.set_invoices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_invoices_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  item_type public.invoice_item_type not null,
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
  constraint invoice_items_line_total_formula_check check (
    line_total >= 0
    and line_total = round((quantity * unit_price) - discount_amount + tax_amount, 3)
  ),
  constraint invoice_items_discount_lte_base_check check (
    discount_amount <= round(quantity * unit_price, 3)
  ),
  constraint invoice_items_service_link_check check (
    item_type <> 'service' or service_id is not null
  ),
  constraint invoice_items_product_link_check check (
    item_type <> 'product' or product_id is not null
  )
);

create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id, sort_order);

create table if not exists public.invoice_status_history (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  previous_status public.invoice_status,
  new_status public.invoice_status not null,
  changed_by uuid references auth.users (id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoice_status_history_invoice_id_idx
  on public.invoice_status_history (invoice_id, created_at);

create table if not exists public.invoice_adjustments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  adjustment_type public.invoice_adjustment_type not null,
  amount numeric(14, 3) not null,
  reason text not null,
  created_by uuid not null references auth.users (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoice_adjustments_invoice_id_idx
  on public.invoice_adjustments (invoice_id, created_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  invoice_id uuid not null references public.invoices (id),
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  amount numeric(14, 3) not null check (amount > 0),
  currency text not null default 'BHD' check (currency = 'BHD'),
  method public.payment_method not null,
  provider text,
  provider_payment_id text,
  status public.payment_status not null,
  confirmed_by uuid references auth.users (id),
  confirmed_at timestamptz,
  failure_code text,
  failure_message text,
  refunded_total numeric(14, 3) not null default 0 check (refunded_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_refunded_lte_amount check (refunded_total <= amount)
);

create index if not exists payments_invoice_id_idx
  on public.payments (invoice_id, created_at);

create index if not exists payments_business_id_idx
  on public.payments (business_id, created_at desc);

create index if not exists payments_customer_id_idx
  on public.payments (customer_id, created_at desc);

create or replace function public.set_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_payments_updated_at();

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  provider text,
  status public.payment_status not null,
  request_metadata jsonb not null default '{}'::jsonb,
  response_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (payment_id, attempt_number)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  provider text,
  provider_event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  signature_valid boolean,
  processed boolean not null default false,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_payment_id_idx
  on public.payment_events (payment_id, created_at);

create unique index if not exists payment_events_provider_event_unique_idx
  on public.payment_events (provider, provider_event_id)
  where provider is not null and provider_event_id is not null;

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id),
  invoice_id uuid not null references public.invoices (id),
  amount numeric(14, 3) not null check (amount > 0),
  status public.refund_status not null default 'pending',
  reason text,
  provider_refund_id text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists refunds_payment_id_idx on public.refunds (payment_id);
create index if not exists refunds_invoice_id_idx on public.refunds (invoice_id);

-- ---------------------------------------------------------------------------
-- record_cash_payment: atomic cash capture against an invoice
-- ---------------------------------------------------------------------------
create or replace function public.record_cash_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_confirmed_by uuid,
  p_request_id text default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_payment public.payments%rowtype;
  v_prev_status public.invoice_status;
  v_new_status public.invoice_status;
  v_prev_paid numeric(14, 3);
  v_new_paid numeric(14, 3);
  v_new_remaining numeric(14, 3);
  v_payment_ref text;
  v_amount numeric(14, 3);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'PAYMENT_AMOUNT_INVALID' using errcode = 'P0001';
  end if;

  v_amount := round(p_amount, 3);
  if v_amount <> p_amount then
    raise exception 'PAYMENT_AMOUNT_INVALID' using errcode = 'P0001';
  end if;

  select * into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'INVOICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_invoice.status in ('paid', 'cancelled', 'refunded', 'partially_refunded') then
    raise exception 'INVOICE_NOT_PAYABLE' using errcode = 'P0001';
  end if;

  if v_invoice.status = 'draft' then
    raise exception 'INVOICE_NOT_PAYABLE' using errcode = 'P0001';
  end if;

  if v_invoice.requires_customer_approval
     and v_invoice.status not in ('customer_approved', 'partially_paid') then
    raise exception 'INVOICE_APPROVAL_REQUIRED' using errcode = 'P0001';
  end if;

  if not v_invoice.requires_customer_approval
     and v_invoice.status not in (
       'issued', 'viewed', 'customer_approved', 'partially_paid', 'overdue'
     ) then
    raise exception 'INVOICE_NOT_PAYABLE' using errcode = 'P0001';
  end if;

  if v_amount > v_invoice.remaining_total then
    raise exception 'PAYMENT_OVERPAYMENT' using errcode = 'P0001';
  end if;

  v_prev_status := v_invoice.status;
  v_prev_paid := v_invoice.paid_total;
  v_new_paid := round(v_invoice.paid_total + v_amount, 3);
  v_new_remaining := round(v_invoice.grand_total - v_new_paid, 3);

  if v_new_remaining < 0 then
    raise exception 'PAYMENT_OVERPAYMENT' using errcode = 'P0001';
  end if;

  if v_new_remaining = 0 then
    v_new_status := 'paid';
  else
    v_new_status := 'partially_paid';
  end if;

  v_payment_ref := public.next_payment_reference();

  insert into public.payments (
    payment_reference,
    invoice_id,
    customer_id,
    business_id,
    amount,
    currency,
    method,
    provider,
    status,
    confirmed_by,
    confirmed_at,
    metadata
  ) values (
    v_payment_ref,
    v_invoice.id,
    v_invoice.customer_id,
    v_invoice.business_id,
    v_amount,
    'BHD',
    'cash',
    'cash',
    'captured',
    p_confirmed_by,
    now(),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'idempotency_key', p_idempotency_key,
      'request_id', p_request_id
    )
  )
  returning * into v_payment;

  insert into public.payment_attempts (
    payment_id,
    attempt_number,
    provider,
    status,
    request_metadata,
    response_metadata
  ) values (
    v_payment.id,
    1,
    'cash',
    'captured',
    jsonb_build_object('amount', v_amount, 'method', 'cash'),
    jsonb_build_object('confirmed_by', p_confirmed_by)
  );

  insert into public.payment_events (
    payment_id,
    provider,
    event_type,
    payload,
    signature_valid,
    processed,
    processed_at
  ) values (
    v_payment.id,
    'cash',
    'cash_payment_recorded',
    jsonb_build_object(
      'amount', v_amount,
      'invoice_id', v_invoice.id,
      'payment_reference', v_payment_ref
    ),
    true,
    true,
    now()
  );

  update public.invoices
  set
    paid_total = v_new_paid,
    remaining_total = v_new_remaining,
    status = v_new_status,
    paid_at = case when v_new_status = 'paid' then now() else paid_at end
  where id = v_invoice.id
  returning * into v_invoice;

  insert into public.invoice_status_history (
    invoice_id,
    previous_status,
    new_status,
    changed_by,
    reason,
    metadata
  ) values (
    v_invoice.id,
    v_prev_status,
    v_new_status,
    p_confirmed_by,
    'cash_payment_recorded',
    jsonb_build_object(
      'payment_id', v_payment.id,
      'amount', v_amount,
      'previous_paid_total', v_prev_paid,
      'new_paid_total', v_new_paid
    )
  );

  perform public.write_audit_log(
    p_confirmed_by,
    'payment.cash_recorded',
    'payment',
    v_payment.id,
    v_prev_status::text,
    v_new_status::text,
    null,
    p_request_id,
    jsonb_build_object('paid_total', v_prev_paid),
    jsonb_build_object(
      'paid_total', v_new_paid,
      'amount', v_amount,
      'invoice_id', v_invoice.id,
      'payment_id', v_payment.id,
      'business_id', v_invoice.business_id,
      'customer_id', v_invoice.customer_id
    ),
    jsonb_build_object('method', 'cash')
  );

  perform public.write_audit_log(
    p_confirmed_by,
    'payment.captured',
    'invoice',
    v_invoice.id,
    v_prev_status::text,
    v_new_status::text,
    null,
    p_request_id,
    jsonb_build_object('paid_total', v_prev_paid, 'status', v_prev_status),
    jsonb_build_object(
      'paid_total', v_new_paid,
      'remaining_total', v_new_remaining,
      'status', v_new_status,
      'payment_id', v_payment.id
    ),
    '{}'::jsonb
  );

  return jsonb_build_object(
    'payment_id', v_payment.id,
    'payment_reference', v_payment.payment_reference,
    'invoice_id', v_invoice.id,
    'amount', v_amount,
    'previous_status', v_prev_status,
    'new_status', v_new_status,
    'previous_paid_total', v_prev_paid,
    'paid_total', v_new_paid,
    'remaining_total', v_new_remaining,
    'paid_at', v_invoice.paid_at
  );
end;
$$;

revoke all on function public.record_cash_payment(uuid, numeric, uuid, text, text, jsonb) from public;
grant execute on function public.record_cash_payment(uuid, numeric, uuid, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- convert_accepted_quotation_to_invoice: copy snapshots + mark quotation
-- ---------------------------------------------------------------------------
create or replace function public.convert_accepted_quotation_to_invoice(
  p_quotation_id uuid,
  p_created_by uuid,
  p_requires_customer_approval boolean default false,
  p_customer_message text default null,
  p_business_notes text default null,
  p_due_at timestamptz default null,
  p_request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
  v_existing_id uuid;
  v_invoice_id uuid;
  v_invoice_number text;
begin
  select * into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'QUOTATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select i.id into v_existing_id
  from public.invoices i
  where i.quotation_id = p_quotation_id
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  if v_quotation.status = 'converted_to_invoice' then
    raise exception 'INVOICE_ALREADY_CREATED_FROM_QUOTATION' using errcode = 'P0001';
  end if;

  if v_quotation.status <> 'accepted' then
    raise exception 'QUOTATION_NOT_EDITABLE' using errcode = 'P0001';
  end if;

  v_invoice_number := public.next_invoice_number();
  v_invoice_id := gen_random_uuid();

  insert into public.invoices (
    id,
    invoice_number,
    customer_id,
    business_id,
    branch_id,
    vehicle_id,
    appointment_id,
    quotation_id,
    status,
    subtotal,
    discount_total,
    tax_total,
    platform_fee_total,
    grand_total,
    paid_total,
    remaining_total,
    currency,
    requires_customer_approval,
    due_at,
    created_by,
    customer_message,
    business_notes
  ) values (
    v_invoice_id,
    v_invoice_number,
    v_quotation.customer_id,
    v_quotation.business_id,
    v_quotation.branch_id,
    v_quotation.vehicle_id,
    v_quotation.appointment_id,
    v_quotation.id,
    'draft',
    v_quotation.subtotal,
    v_quotation.discount_total,
    v_quotation.tax_total,
    0,
    v_quotation.grand_total,
    0,
    v_quotation.grand_total,
    'BHD',
    coalesce(p_requires_customer_approval, false),
    p_due_at,
    p_created_by,
    coalesce(p_customer_message, v_quotation.customer_message),
    coalesce(p_business_notes, v_quotation.business_notes)
  );

  insert into public.invoice_items (
    invoice_id,
    item_type,
    service_id,
    product_id,
    description,
    quantity,
    unit_price,
    discount_amount,
    tax_amount,
    line_total,
    service_name_snapshot,
    product_name_snapshot,
    sku_snapshot,
    sort_order
  )
  select
    v_invoice_id,
    qi.item_type::text::public.invoice_item_type,
    qi.service_id,
    qi.product_id,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.discount_amount,
    qi.tax_amount,
    qi.line_total,
    qi.service_name_snapshot,
    qi.product_name_snapshot,
    qi.sku_snapshot,
    qi.sort_order
  from public.quotation_items qi
  where qi.quotation_id = p_quotation_id
  order by qi.sort_order, qi.created_at;

  insert into public.invoice_status_history (
    invoice_id,
    previous_status,
    new_status,
    changed_by,
    reason,
    metadata
  ) values (
    v_invoice_id,
    null,
    'draft',
    p_created_by,
    'created_from_quotation',
    jsonb_build_object('quotation_id', p_quotation_id)
  );

  update public.quotations
  set status = 'converted_to_invoice'
  where id = p_quotation_id;

  insert into public.quotation_status_history (
    quotation_id,
    from_status,
    to_status,
    changed_by,
    note
  ) values (
    p_quotation_id,
    'accepted',
    'converted_to_invoice',
    p_created_by,
    'converted_to_invoice'
  );

  perform public.write_audit_log(
    p_created_by,
    'invoice.created_from_quotation',
    'invoice',
    v_invoice_id,
    'accepted',
    'draft',
    null,
    p_request_id,
    jsonb_build_object('quotation_id', p_quotation_id),
    jsonb_build_object(
      'invoice_id', v_invoice_id,
      'quotation_id', p_quotation_id,
      'grand_total', v_quotation.grand_total
    ),
    '{}'::jsonb
  );

  return v_invoice_id;
end;
$$;

revoke all on function public.convert_accepted_quotation_to_invoice(
  uuid, uuid, boolean, text, text, timestamptz, text
) from public;
grant execute on function public.convert_accepted_quotation_to_invoice(
  uuid, uuid, boolean, text, text, timestamptz, text
) to service_role;
