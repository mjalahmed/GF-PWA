-- Phase 10: dispute RLS + private evidence storage

alter table public.disputes enable row level security;
alter table public.dispute_messages enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.dispute_status_history enable row level security;
alter table public.dispute_resolution_actions enable row level security;

-- Disputes select
create policy disputes_select_own_or_member_or_admin
  on public.disputes for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('dispute.read_all')
    or public.has_permission('dispute.read_own')
    or public.has_permission('business.dispute.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('dispute_officer')
    or public.has_role('support_agent')
  );

create policy disputes_service_role_all
  on public.disputes for all to service_role
  using (true) with check (true);

-- Messages: public messages for parties; internal only for admins
create policy dispute_messages_select_party_or_admin
  on public.dispute_messages for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          (
            is_internal = false
            and (
              d.customer_id = auth.uid()
              or public.is_business_member(d.business_id, true)
            )
          )
          or public.has_permission('dispute.read_all')
          or public.has_permission('dispute.internal_note')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

create policy dispute_messages_service_role_all
  on public.dispute_messages for all to service_role
  using (true) with check (true);

-- Evidence
create policy dispute_evidence_select_party_or_admin
  on public.dispute_evidence for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.is_business_member(d.business_id, true)
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

create policy dispute_evidence_service_role_all
  on public.dispute_evidence for all to service_role
  using (true) with check (true);

-- Status history
create policy dispute_status_history_select_party_or_admin
  on public.dispute_status_history for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.is_business_member(d.business_id, true)
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
  );

create policy dispute_status_history_service_role_all
  on public.dispute_status_history for all to service_role
  using (true) with check (true);

-- Resolution actions: parties see non-internal summary via API; table select for parties ok for public actions
create policy dispute_resolution_actions_select_party_or_admin
  on public.dispute_resolution_actions for select to authenticated
  using (
    exists (
      select 1 from public.disputes d
      where d.id = dispute_id
        and (
          d.customer_id = auth.uid()
          or public.is_business_member(d.business_id, true)
          or public.has_permission('dispute.read_all')
          or public.has_role('admin')
          or public.has_role('super_admin')
          or public.has_role('dispute_officer')
          or public.has_role('support_agent')
        )
    )
    and action_type <> 'internal_note'
  );

create policy dispute_resolution_actions_select_admin_all
  on public.dispute_resolution_actions for select to authenticated
  using (
    public.has_permission('dispute.read_all')
    or public.has_permission('dispute.internal_note')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or public.has_role('dispute_officer')
  );

create policy dispute_resolution_actions_service_role_all
  on public.dispute_resolution_actions for all to service_role
  using (true) with check (true);

grant select on public.disputes to authenticated;
grant select on public.dispute_messages to authenticated;
grant select on public.dispute_evidence to authenticated;
grant select on public.dispute_status_history to authenticated;
grant select on public.dispute_resolution_actions to authenticated;

grant select, insert, update, delete on public.disputes to service_role;
grant select, insert, update, delete on public.dispute_messages to service_role;
grant select, insert, update, delete on public.dispute_evidence to service_role;
grant select, insert, update, delete on public.dispute_status_history to service_role;
grant select, insert, update, delete on public.dispute_resolution_actions to service_role;
grant usage, select on sequence public.dispute_number_seq to service_role;

-- Private evidence bucket
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dispute-evidence',
  'dispute-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: disputes/{disputeId}/{userId}/{evidenceId}/{filename}
-- Authenticated users may only insert under their own userId folder; service role does privileged uploads.
create policy dispute_evidence_storage_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dispute-evidence'
    and (storage.foldername(name))[1] = 'disputes'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

create policy dispute_evidence_storage_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'dispute-evidence'
    and (
      (storage.foldername(name))[3] = auth.uid()::text
      or public.has_permission('dispute.read_all')
      or public.has_role('admin')
      or public.has_role('super_admin')
      or public.has_role('dispute_officer')
      or public.has_role('support_agent')
      or exists (
        select 1
        from public.disputes d
        where d.id::text = (storage.foldername(name))[2]
          and (
            d.customer_id = auth.uid()
            or public.is_business_member(d.business_id, true)
          )
      )
    )
  );

create policy dispute_evidence_storage_service_role_all
  on storage.objects for all to service_role
  using (bucket_id = 'dispute-evidence')
  with check (bucket_id = 'dispute-evidence');
