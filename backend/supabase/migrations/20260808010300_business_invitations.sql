-- Business member invitations (token hash only)
create type public.business_invitation_status as enum (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

create table public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  membership_role public.business_membership_role not null,
  token_hash text not null unique,
  status public.business_invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_invitations_email_format_check
    check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint business_invitations_role_not_owner_via_invite_check
    check (membership_role <> 'owner'),
  constraint business_invitations_expiry_check
    check (expires_at > created_at)
);

create unique index business_invitations_pending_email_uidx
  on public.business_invitations (business_id, lower(email))
  where status = 'pending';

create index business_invitations_business_id_idx
  on public.business_invitations (business_id);

create index business_invitations_status_idx
  on public.business_invitations (status);

create index business_invitations_expires_at_idx
  on public.business_invitations (expires_at);

create trigger business_invitations_set_updated_at
  before update on public.business_invitations
  for each row
  execute function public.set_updated_at();
