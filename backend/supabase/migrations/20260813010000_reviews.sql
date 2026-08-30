-- Phase 9: verified review eligibility, reviews, moderation, aggregates

do $$ begin
  create type public.review_verification_type as enum (
    'completed_appointment_paid_invoice',
    'paid_invoice',
    'admin_verified'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum (
    'pending',
    'published',
    'hidden',
    'flagged',
    'removed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_rating_dimension as enum (
    'work_quality',
    'pricing_transparency',
    'timeliness',
    'customer_service',
    'overall_experience'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_report_reason as enum (
    'spam',
    'abusive',
    'personal_information',
    'fraudulent',
    'irrelevant',
    'conflict_of_interest',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_report_status as enum (
    'open',
    'reviewed',
    'dismissed',
    'action_taken'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_moderation_action as enum (
    'flag',
    'hide',
    'restore',
    'remove',
    'dismiss_report'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.review_eligibilities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  appointment_id uuid references public.appointments (id),
  invoice_id uuid references public.invoices (id),
  payment_id uuid references public.payments (id),
  verification_type public.review_verification_type not null,
  is_used boolean not null default false,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_eligibilities_source_check check (
    invoice_id is not null or appointment_id is not null or verification_type = 'admin_verified'
  )
);

create unique index if not exists review_eligibilities_invoice_id_uidx
  on public.review_eligibilities (invoice_id)
  where invoice_id is not null;

create unique index if not exists review_eligibilities_appointment_invoice_uidx
  on public.review_eligibilities (appointment_id, invoice_id)
  where appointment_id is not null and invoice_id is not null;

create index if not exists review_eligibilities_customer_unused_idx
  on public.review_eligibilities (customer_id, is_used, created_at desc);

create index if not exists review_eligibilities_business_idx
  on public.review_eligibilities (business_id, created_at desc);

create or replace function public.set_review_eligibilities_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists review_eligibilities_set_updated_at on public.review_eligibilities;
create trigger review_eligibilities_set_updated_at
  before update on public.review_eligibilities
  for each row execute function public.set_review_eligibilities_updated_at();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  eligibility_id uuid not null unique references public.review_eligibilities (id),
  customer_id uuid not null references auth.users (id),
  business_id uuid not null references public.businesses (id),
  overall_rating integer not null check (overall_rating between 1 and 5),
  comment text,
  status public.review_status not null default 'published',
  published_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_comment_length_check check (comment is null or char_length(comment) <= 4000)
);

create index if not exists reviews_business_status_idx
  on public.reviews (business_id, status, created_at desc);

create index if not exists reviews_customer_idx
  on public.reviews (customer_id, created_at desc);

create or replace function public.set_reviews_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_reviews_updated_at();

create table if not exists public.review_ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  dimension public.review_rating_dimension not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (review_id, dimension)
);

create table if not exists public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  business_id uuid not null references public.businesses (id),
  responded_by uuid not null references auth.users (id),
  response text not null check (char_length(response) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_review_responses_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists review_responses_set_updated_at on public.review_responses;
create trigger review_responses_set_updated_at
  before update on public.review_responses
  for each row execute function public.set_review_responses_updated_at();

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reported_by uuid not null references auth.users (id),
  reason_code public.review_report_reason not null,
  details text,
  status public.review_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id)
);

create unique index if not exists review_reports_open_unique_idx
  on public.review_reports (review_id, reported_by)
  where status = 'open';

create index if not exists review_reports_status_idx
  on public.review_reports (status, created_at desc);

create table if not exists public.review_moderation_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  moderator_id uuid not null references auth.users (id),
  action public.review_moderation_action not null,
  previous_status public.review_status,
  new_status public.review_status,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists review_moderation_events_review_idx
  on public.review_moderation_events (review_id, created_at);

-- ---------------------------------------------------------------------------
-- Business rating aggregate (published reviews only)
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_business_rating(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_avg numeric(3, 2);
begin
  select
    count(*)::integer,
    coalesce(round(avg(overall_rating)::numeric, 2), 0)
  into v_count, v_avg
  from public.reviews
  where business_id = p_business_id
    and status = 'published';

  update public.businesses
  set
    rating_count = v_count,
    average_rating = v_avg
  where id = p_business_id;

  perform public.write_audit_log(
    null,
    'business.rating_recalculated',
    'business',
    p_business_id,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object('rating_count', v_count, 'average_rating', v_avg),
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.recalculate_business_rating(uuid) from public;
grant execute on function public.recalculate_business_rating(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- ensure_review_eligibility — idempotent helper for paid+completed paths
-- ---------------------------------------------------------------------------
create or replace function public.ensure_review_eligibility(
  p_invoice_id uuid default null,
  p_appointment_id uuid default null,
  p_actor_user_id uuid default null,
  p_request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_appointment public.appointments%rowtype;
  v_payment_id uuid;
  v_existing_id uuid;
  v_eligibility_id uuid;
  v_verification public.review_verification_type;
  v_customer_id uuid;
  v_business_id uuid;
  v_appointment_id uuid;
  v_invoice_id uuid;
begin
  if p_invoice_id is null and p_appointment_id is null then
    raise exception 'REVIEW_NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  if p_invoice_id is not null then
    select * into v_invoice from public.invoices where id = p_invoice_id;
    if not found then
      return null;
    end if;
    if v_invoice.status <> 'paid' then
      return null;
    end if;
    v_invoice_id := v_invoice.id;
    v_customer_id := v_invoice.customer_id;
    v_business_id := v_invoice.business_id;
    v_appointment_id := coalesce(p_appointment_id, v_invoice.appointment_id);

    select id into v_existing_id
    from public.review_eligibilities
    where invoice_id = v_invoice_id
    limit 1;
    if v_existing_id is not null then
      return v_existing_id;
    end if;

    if v_appointment_id is not null then
      select * into v_appointment from public.appointments where id = v_appointment_id;
      if not found then
        return null;
      end if;
      if v_appointment.status <> 'completed' then
        return null;
      end if;
      if v_appointment.customer_id <> v_invoice.customer_id
         or v_appointment.business_id <> v_invoice.business_id then
        return null;
      end if;
      v_verification := 'completed_appointment_paid_invoice';
    else
      v_verification := 'paid_invoice';
    end if;
  else
    -- appointment-only entry: look for a paid invoice linked to this appointment
    select * into v_appointment from public.appointments where id = p_appointment_id;
    if not found or v_appointment.status <> 'completed' then
      return null;
    end if;

    select * into v_invoice
    from public.invoices
    where appointment_id = p_appointment_id
      and customer_id = v_appointment.customer_id
      and business_id = v_appointment.business_id
      and status = 'paid'
    order by paid_at desc nulls last, created_at desc
    limit 1;

    if not found then
      return null;
    end if;

    select id into v_existing_id
    from public.review_eligibilities
    where invoice_id = v_invoice.id
    limit 1;
    if v_existing_id is not null then
      return v_existing_id;
    end if;

    v_invoice_id := v_invoice.id;
    v_customer_id := v_appointment.customer_id;
    v_business_id := v_appointment.business_id;
    v_appointment_id := v_appointment.id;
    v_verification := 'completed_appointment_paid_invoice';
  end if;

  select p.id into v_payment_id
  from public.payments p
  where p.invoice_id = v_invoice_id
    and p.status = 'captured'
  order by p.confirmed_at desc nulls last, p.created_at desc
  limit 1;

  insert into public.review_eligibilities (
    customer_id,
    business_id,
    appointment_id,
    invoice_id,
    payment_id,
    verification_type,
    expires_at
  ) values (
    v_customer_id,
    v_business_id,
    v_appointment_id,
    v_invoice_id,
    v_payment_id,
    v_verification,
    now() + interval '90 days'
  )
  returning id into v_eligibility_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'review.eligibility_created',
    'review_eligibility',
    v_eligibility_id,
    null,
    null,
    null,
    p_request_id,
    null,
    jsonb_build_object(
      'verification_type', v_verification,
      'invoice_id', v_invoice_id,
      'appointment_id', v_appointment_id,
      'business_id', v_business_id,
      'customer_id', v_customer_id
    ),
    '{}'::jsonb
  );

  return v_eligibility_id;
exception
  when unique_violation then
    select id into v_eligibility_id
    from public.review_eligibilities
    where invoice_id = v_invoice_id
    limit 1;
    return v_eligibility_id;
end;
$$;

revoke all on function public.ensure_review_eligibility(uuid, uuid, uuid, text) from public;
grant execute on function public.ensure_review_eligibility(uuid, uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- create_verified_review — atomic eligibility consumption
-- ---------------------------------------------------------------------------
create or replace function public.create_verified_review(
  p_eligibility_id uuid,
  p_customer_id uuid,
  p_overall_rating integer,
  p_comment text default null,
  p_ratings jsonb default '{}'::jsonb,
  p_request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_elig public.review_eligibilities%rowtype;
  v_review_id uuid;
  v_existing_review uuid;
  v_dim text;
  v_rating integer;
  v_required text[] := array[
    'work_quality',
    'pricing_transparency',
    'timeliness',
    'customer_service',
    'overall_experience'
  ];
begin
  if p_overall_rating is null or p_overall_rating < 1 or p_overall_rating > 5 then
    raise exception 'REVIEW_RATING_INVALID' using errcode = 'P0001';
  end if;

  select * into v_elig
  from public.review_eligibilities
  where id = p_eligibility_id
  for update;

  if not found then
    raise exception 'REVIEW_ELIGIBILITY_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_elig.customer_id <> p_customer_id then
    raise exception 'REVIEW_NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  if v_elig.is_used then
    select id into v_existing_review from public.reviews where eligibility_id = p_eligibility_id;
    if v_existing_review is not null then
      raise exception 'REVIEW_ELIGIBILITY_ALREADY_USED' using errcode = 'P0001';
    end if;
    raise exception 'REVIEW_ELIGIBILITY_ALREADY_USED' using errcode = 'P0001';
  end if;

  if v_elig.expires_at is not null and v_elig.expires_at <= now() then
    raise exception 'REVIEW_NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  select id into v_existing_review from public.reviews where eligibility_id = p_eligibility_id;
  if v_existing_review is not null then
    raise exception 'REVIEW_ALREADY_EXISTS' using errcode = 'P0001';
  end if;

  foreach v_dim in array v_required loop
    if p_ratings ->> v_dim is null then
      raise exception 'REVIEW_RATING_INVALID' using errcode = 'P0001';
    end if;
    v_rating := (p_ratings ->> v_dim)::integer;
    if v_rating < 1 or v_rating > 5 then
      raise exception 'REVIEW_RATING_INVALID' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.reviews (
    eligibility_id,
    customer_id,
    business_id,
    overall_rating,
    comment,
    status,
    published_at
  ) values (
    p_eligibility_id,
    p_customer_id,
    v_elig.business_id,
    p_overall_rating,
    nullif(trim(coalesce(p_comment, '')), ''),
    'published',
    now()
  )
  returning id into v_review_id;

  foreach v_dim in array v_required loop
    insert into public.review_ratings (review_id, dimension, rating)
    values (v_review_id, v_dim::public.review_rating_dimension, (p_ratings ->> v_dim)::integer);
  end loop;

  update public.review_eligibilities
  set is_used = true, used_at = now()
  where id = p_eligibility_id;

  perform public.recalculate_business_rating(v_elig.business_id);

  perform public.write_audit_log(
    p_customer_id,
    'review.created',
    'review',
    v_review_id,
    null,
    'published',
    null,
    p_request_id,
    null,
    jsonb_build_object(
      'eligibility_id', p_eligibility_id,
      'business_id', v_elig.business_id,
      'overall_rating', p_overall_rating
    ),
    '{}'::jsonb
  );

  return v_review_id;
end;
$$;

revoke all on function public.create_verified_review(uuid, uuid, integer, text, jsonb, text) from public;
grant execute on function public.create_verified_review(uuid, uuid, integer, text, jsonb, text) to service_role;

-- ---------------------------------------------------------------------------
-- Triggers: call ensure_review_eligibility from paid invoice / completed appt
-- ---------------------------------------------------------------------------
create or replace function public.trg_invoice_paid_review_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    perform public.ensure_review_eligibility(
      new.id,
      new.appointment_id,
      new.created_by,
      null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_review_eligibility on public.invoices;
create trigger invoices_review_eligibility
  after insert or update of status on public.invoices
  for each row execute function public.trg_invoice_paid_review_eligibility();

create or replace function public.trg_appointment_completed_review_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.ensure_review_eligibility(
      null,
      new.id,
      new.customer_id,
      null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_review_eligibility on public.appointments;
create trigger appointments_review_eligibility
  after insert or update of status on public.appointments
  for each row execute function public.trg_appointment_completed_review_eligibility();
