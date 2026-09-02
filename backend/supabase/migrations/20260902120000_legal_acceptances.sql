-- Legal document acceptance audit trail (customer signup + provider agreement).
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_type text not null,
  document_version text not null,
  business_id uuid references public.businesses (id) on delete set null,
  accepted_at timestamptz not null default timezone('utc', now()),
  constraint legal_acceptances_document_type_check check (
    document_type in (
      'customer_terms',
      'privacy_policy',
      'provider_agreement',
      'beta_notice',
      'dispute_policy',
      'review_policy',
      'cancellation_refund'
    )
  )
);

create unique index if not exists legal_acceptances_user_type_version_business_uidx
  on public.legal_acceptances (
    user_id,
    document_type,
    document_version,
    coalesce(business_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists legal_acceptances_user_id_idx
  on public.legal_acceptances (user_id, accepted_at desc);

alter table public.legal_acceptances enable row level security;

create policy legal_acceptances_select_own
  on public.legal_acceptances for select to authenticated
  using (user_id = auth.uid());

create policy legal_acceptances_insert_own
  on public.legal_acceptances for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.legal_acceptances to authenticated;
grant select, insert, update, delete on public.legal_acceptances to service_role;
