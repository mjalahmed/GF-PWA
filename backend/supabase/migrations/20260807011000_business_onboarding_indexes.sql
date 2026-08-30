-- Supplementary indexes for business onboarding queries
create index business_applications_review_queue_idx
  on public.business_applications (status, submitted_at)
  where status in ('submitted', 'under_review', 'changes_requested');

create index business_applications_created_business_id_idx
  on public.business_applications (created_business_id)
  where created_business_id is not null;

create index business_application_steps_status_idx
  on public.business_application_steps (application_id, status);

create index business_application_documents_uploaded_by_idx
  on public.business_application_documents (uploaded_by);

create index business_application_documents_reviewed_by_idx
  on public.business_application_documents (reviewed_by)
  where reviewed_by is not null;

create index business_application_reviews_action_idx
  on public.business_application_reviews (action);

create index businesses_display_name_idx
  on public.businesses (display_name);

create index businesses_source_application_id_idx
  on public.businesses (source_application_id)
  where source_application_id is not null;

create index business_memberships_business_role_idx
  on public.business_memberships (business_id, role)
  where status = 'active';

create index business_branches_primary_lookup_idx
  on public.business_branches (business_id)
  where is_primary = true;

create index business_application_branches_city_idx
  on public.business_application_branches (city);

create index business_document_requirements_document_type_idx
  on public.business_document_requirements (document_type);
