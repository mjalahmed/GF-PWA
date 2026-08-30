-- Business settings (feature flags + booking defaults)
create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  appointments_enabled boolean not null default false,
  products_enabled boolean not null default false,
  quotations_enabled boolean not null default false,
  invoices_enabled boolean not null default false,
  cash_payments_enabled boolean not null default false,
  online_payments_enabled boolean not null default false,
  reviews_enabled boolean not null default true,
  auto_confirm_appointments boolean not null default false,
  default_appointment_duration_minutes integer,
  minimum_booking_notice_minutes integer,
  maximum_booking_days_ahead integer,
  cancellation_notice_minutes integer,
  currency text not null default 'BHD',
  locale text not null default 'en',
  timezone text not null default 'Asia/Bahrain',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_settings_duration_nonneg_check
    check (
      coalesce(default_appointment_duration_minutes, 0) >= 0
      and coalesce(minimum_booking_notice_minutes, 0) >= 0
      and coalesce(maximum_booking_days_ahead, 0) >= 0
      and coalesce(cancellation_notice_minutes, 0) >= 0
    ),
  constraint business_settings_currency_check
    check (char_length(currency) between 3 and 3),
  constraint business_settings_locale_check
    check (char_length(locale) between 2 and 10)
);

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row
  execute function public.set_updated_at();

-- Public rating aggregates (reviews module deferred; defaults until then)
alter table public.businesses
  add column if not exists average_rating numeric(3, 2) not null default 0,
  add column if not exists rating_count integer not null default 0;

alter table public.businesses
  drop constraint if exists businesses_average_rating_check;
alter table public.businesses
  add constraint businesses_average_rating_check
  check (average_rating >= 0 and average_rating <= 5);

alter table public.businesses
  drop constraint if exists businesses_rating_count_check;
alter table public.businesses
  add constraint businesses_rating_count_check
  check (rating_count >= 0);

-- Auto-create settings when a business is created
create or replace function public.create_default_business_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_settings (business_id)
  values (new.id)
  on conflict (business_id) do nothing;
  return new;
end;
$$;

drop trigger if exists businesses_create_default_settings on public.businesses;
create trigger businesses_create_default_settings
  after insert on public.businesses
  for each row
  execute function public.create_default_business_settings();

-- Backfill settings for existing businesses
insert into public.business_settings (business_id)
select b.id from public.businesses b
on conflict (business_id) do nothing;
