-- Uploaded application documents
create type public.business_application_document_status as enum (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'expired'
);

create table public.business_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  document_requirement_id uuid not null references public.business_document_requirements (id) on delete restrict,
  document_type text not null,
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  document_number text,
  expires_at timestamptz,
  status public.business_application_document_status not null default 'pending',
  rejection_reason text,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_application_documents_file_size_check
    check (file_size_bytes > 0),
  constraint business_application_documents_mime_type_check
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png'))
);

create index business_application_documents_application_id_idx
  on public.business_application_documents (application_id);

create index business_application_documents_requirement_id_idx
  on public.business_application_documents (document_requirement_id);

create index business_application_documents_status_idx
  on public.business_application_documents (status);

create unique index business_application_documents_active_requirement_uidx
  on public.business_application_documents (application_id, document_requirement_id)
  where status not in ('rejected', 'expired');

create trigger business_application_documents_set_updated_at
  before update on public.business_application_documents
  for each row
  execute function public.set_updated_at();
