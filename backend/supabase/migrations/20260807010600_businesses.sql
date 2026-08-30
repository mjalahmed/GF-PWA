-- Registered businesses created from approved applications
create type public.business_status as enum (
  'draft',
  'pending_review',
  'active',
  'suspended',
  'rejected',
  'closed'
);

create type public.business_verification_status as enum (
  'unverified',
  'documents_pending',
  'under_review',
  'verified',
  'rejected',
  'expired'
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_category_id uuid not null references public.business_categories (id) on delete restrict,
  legal_name text not null,
  display_name text not null,
  description text,
  commercial_registration_number text,
  phone text not null,
  email text not null,
  website text,
  status public.business_status not null default 'draft',
  verification_status public.business_verification_status not null default 'unverified',
  source_application_id uuid unique references public.business_applications (id) on delete set null,
  logo_path text,
  cover_path text,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  suspended_at timestamptz,
  suspended_reason text,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint businesses_email_format_check
    check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint businesses_phone_format_check
    check (phone ~ '^\+?[0-9[:space:]-]{8,20}$'),
  constraint businesses_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index businesses_business_category_id_idx
  on public.businesses (business_category_id);

create index businesses_status_idx
  on public.businesses (status);

create index businesses_verification_status_idx
  on public.businesses (verification_status);

create unique index businesses_commercial_registration_uidx
  on public.businesses (commercial_registration_number)
  where commercial_registration_number is not null;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row
  execute function public.set_updated_at();

alter table public.business_applications
  add constraint business_applications_created_business_id_fkey
  foreign key (created_business_id) references public.businesses (id) on delete set null;
