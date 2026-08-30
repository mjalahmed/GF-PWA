-- Business-management indexes
create index if not exists businesses_slug_idx on public.businesses (slug);
create index if not exists businesses_status_verification_idx
  on public.businesses (status, verification_status);

create index if not exists business_settings_business_id_idx
  on public.business_settings (business_id);

create index if not exists business_memberships_business_role_status_idx
  on public.business_memberships (business_id, role, status);

create index if not exists business_invitations_token_hash_idx
  on public.business_invitations (token_hash);
