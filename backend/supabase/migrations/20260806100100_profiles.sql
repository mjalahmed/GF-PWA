-- Profiles linked 1:1 with auth.users
create type public.user_status as enum (
  'active',
  'suspended',
  'blocked',
  'pending_deletion'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  preferred_language text not null default 'en',
  status public.user_status not null default 'active',
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_preferred_language_check
    check (preferred_language in ('en', 'ar')),
  constraint profiles_phone_format_check
    check (phone is null or phone ~ '^\+?[0-9[:space:]-]{8,20}$')
);

create index profiles_status_idx on public.profiles (status);
create index profiles_last_active_at_idx on public.profiles (last_active_at);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
