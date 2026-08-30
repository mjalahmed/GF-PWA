-- Document requirements per business category
create table public.business_document_requirements (
  id uuid primary key default gen_random_uuid(),
  business_category_id uuid not null references public.business_categories (id) on delete cascade,
  document_type text not null,
  display_name text not null,
  description text,
  is_required boolean not null default true,
  requires_expiry_date boolean not null default false,
  allowed_mime_types text[] not null default array[
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]::text[],
  maximum_file_size_bytes bigint not null default 10485760,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_category_id, document_type),
  constraint business_document_requirements_max_size_check
    check (maximum_file_size_bytes > 0 and maximum_file_size_bytes <= 52428800)
);

create index business_document_requirements_category_active_idx
  on public.business_document_requirements (business_category_id, is_active, sort_order);

create trigger business_document_requirements_set_updated_at
  before update on public.business_document_requirements
  for each row
  execute function public.set_updated_at();

insert into public.business_document_requirements (
  business_category_id,
  document_type,
  display_name,
  description,
  is_required,
  requires_expiry_date,
  allowed_mime_types,
  maximum_file_size_bytes,
  sort_order
)
select
  bc.id,
  doc.document_type,
  doc.display_name,
  doc.description,
  true,
  doc.requires_expiry_date,
  array['application/pdf', 'image/jpeg', 'image/png']::text[],
  10485760,
  doc.sort_order
from public.business_categories bc
cross join (
  values
    (
      'commercial_registration',
      'Commercial Registration',
      'Valid commercial registration certificate (CR)',
      false,
      10
    ),
    (
      'municipality_license',
      'Municipality License',
      'Municipality trade or operating license',
      true,
      20
    ),
    (
      'owner_identification',
      'Owner Identification',
      'Government-issued identification of the business owner',
      false,
      30
    ),
    (
      'bank_account_proof',
      'Bank Account Proof',
      'Proof of business bank account (IBAN letter or bank statement)',
      false,
      40
    ),
    (
      'business_location_proof',
      'Business Location Proof',
      'Lease agreement or utility bill proving business location',
      false,
      50
    )
) as doc (
  document_type,
  display_name,
  description,
  requires_expiry_date,
  sort_order
);
