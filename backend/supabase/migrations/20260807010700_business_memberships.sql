-- Business team memberships
create type public.business_membership_role as enum (
  'owner',
  'manager',
  'service_advisor',
  'mechanic',
  'cashier',
  'receptionist',
  'staff'
);

create type public.business_membership_status as enum (
  'invited',
  'active',
  'suspended',
  'removed'
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.business_membership_role not null,
  status public.business_membership_status not null default 'invited',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index business_memberships_business_id_idx
  on public.business_memberships (business_id);

create index business_memberships_user_id_idx
  on public.business_memberships (user_id);

create index business_memberships_status_idx
  on public.business_memberships (status);

create unique index business_memberships_business_user_active_uidx
  on public.business_memberships (business_id, user_id)
  where status = 'active';

create trigger business_memberships_set_updated_at
  before update on public.business_memberships
  for each row
  execute function public.set_updated_at();
