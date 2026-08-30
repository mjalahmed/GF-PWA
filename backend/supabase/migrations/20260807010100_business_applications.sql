-- Business onboarding applications and primary branch draft
create type public.business_application_status as enum (
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn'
);

create table public.business_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references public.profiles (id) on delete restrict,
  business_category_id uuid not null references public.business_categories (id) on delete restrict,
  legal_name text not null,
  display_name text not null,
  description text,
  commercial_registration_number text,
  phone text not null,
  email text not null,
  website text,
  status public.business_application_status not null default 'draft',
  current_step text not null default 'business_information',
  submitted_at timestamptz,
  review_started_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  withdrawn_at timestamptz,
  changes_requested_at timestamptz,
  rejection_reason text,
  changes_requested_reason text,
  assigned_reviewer_id uuid references public.profiles (id) on delete set null,
  created_business_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_applications_email_format_check
    check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint business_applications_phone_format_check
    check (phone ~ '^\+?[0-9[:space:]-]{8,20}$'),
  constraint business_applications_current_step_check
    check (current_step in (
      'business_information',
      'contact_information',
      'branch_information',
      'documents',
      'review_and_submit'
    ))
);

create index business_applications_applicant_user_id_idx
  on public.business_applications (applicant_user_id);

create index business_applications_business_category_id_idx
  on public.business_applications (business_category_id);

create index business_applications_status_idx
  on public.business_applications (status);

create index business_applications_assigned_reviewer_id_idx
  on public.business_applications (assigned_reviewer_id);

create index business_applications_submitted_at_idx
  on public.business_applications (submitted_at);

create unique index business_applications_commercial_registration_uidx
  on public.business_applications (commercial_registration_number)
  where commercial_registration_number is not null
    and status not in ('rejected', 'withdrawn');

create trigger business_applications_set_updated_at
  before update on public.business_applications
  for each row
  execute function public.set_updated_at();

create or replace function public.enforce_business_application_update_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.status is distinct from old.status then
      raise exception 'PERMISSION_DENIED: application status cannot be changed by client'
        using errcode = '42501';
    end if;

    if new.assigned_reviewer_id is distinct from old.assigned_reviewer_id then
      raise exception 'PERMISSION_DENIED: assigned_reviewer_id cannot be changed by client'
        using errcode = '42501';
    end if;

    if new.created_business_id is distinct from old.created_business_id then
      raise exception 'PERMISSION_DENIED: created_business_id cannot be changed by client'
        using errcode = '42501';
    end if;

    if new.applicant_user_id is distinct from old.applicant_user_id then
      raise exception 'PERMISSION_DENIED: applicant_user_id is immutable'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger business_applications_enforce_update_guards
  before update on public.business_applications
  for each row
  execute function public.enforce_business_application_update_guards();

create table public.business_application_branches (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.business_applications (id) on delete cascade,
  name text,
  phone text,
  email text,
  address_line text,
  area text,
  city text,
  country_code text not null default 'BH',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  timezone text not null default 'Asia/Bahrain',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_application_branches_country_code_check
    check (char_length(country_code) = 2),
  constraint business_application_branches_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint business_application_branches_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create trigger business_application_branches_set_updated_at
  before update on public.business_application_branches
  for each row
  execute function public.set_updated_at();
