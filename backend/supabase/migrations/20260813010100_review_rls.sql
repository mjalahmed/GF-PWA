-- Phase 9: review RLS

alter table public.review_eligibilities enable row level security;
alter table public.reviews enable row level security;
alter table public.review_ratings enable row level security;
alter table public.review_responses enable row level security;
alter table public.review_reports enable row level security;
alter table public.review_moderation_events enable row level security;

-- Eligibilities: owner customer or admin only (business cannot read others' eligibility)
create policy review_eligibilities_select_own
  on public.review_eligibilities for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy review_eligibilities_service_role_all
  on public.review_eligibilities for all to service_role
  using (true) with check (true);

-- Reviews: public published; own; business member; moderators
create policy reviews_select_published_or_own_or_member
  on public.reviews for select to authenticated
  using (
    status = 'published'
    or customer_id = auth.uid()
    or public.is_business_member(business_id, true)
    or public.has_permission('review.moderate')
    or public.has_permission('business.review.read')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy reviews_select_anon_published
  on public.reviews for select to anon
  using (status = 'published');

create policy reviews_service_role_all
  on public.reviews for all to service_role
  using (true) with check (true);

-- Ratings follow review visibility
create policy review_ratings_select_via_review
  on public.review_ratings for select to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.status = 'published'
          or r.customer_id = auth.uid()
          or public.is_business_member(r.business_id, true)
          or public.has_permission('review.moderate')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy review_ratings_select_anon_published
  on public.review_ratings for select to anon
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id and r.status = 'published'
    )
  );

create policy review_ratings_service_role_all
  on public.review_ratings for all to service_role
  using (true) with check (true);

-- Responses: same visibility as review
create policy review_responses_select_via_review
  on public.review_responses for select to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.status = 'published'
          or r.customer_id = auth.uid()
          or public.is_business_member(r.business_id, true)
          or public.has_permission('review.moderate')
          or public.has_role('admin')
          or public.has_role('super_admin')
        )
    )
  );

create policy review_responses_select_anon_published
  on public.review_responses for select to anon
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id and r.status = 'published'
    )
  );

create policy review_responses_service_role_all
  on public.review_responses for all to service_role
  using (true) with check (true);

-- Reports: reporter, moderators
create policy review_reports_select_own_or_moderator
  on public.review_reports for select to authenticated
  using (
    reported_by = auth.uid()
    or public.has_permission('review.report.read')
    or public.has_permission('review.moderate')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy review_reports_service_role_all
  on public.review_reports for all to service_role
  using (true) with check (true);

-- Moderation events: moderators only
create policy review_moderation_events_select_moderator
  on public.review_moderation_events for select to authenticated
  using (
    public.has_permission('review.moderate')
    or public.has_role('admin')
    or public.has_role('super_admin')
  );

create policy review_moderation_events_service_role_all
  on public.review_moderation_events for all to service_role
  using (true) with check (true);

grant select on public.review_eligibilities to authenticated;
grant select on public.reviews to authenticated, anon;
grant select on public.review_ratings to authenticated, anon;
grant select on public.review_responses to authenticated, anon;
grant select on public.review_reports to authenticated;
grant select on public.review_moderation_events to authenticated;

grant select, insert, update, delete on public.review_eligibilities to service_role;
grant select, insert, update, delete on public.reviews to service_role;
grant select, insert, update, delete on public.review_ratings to service_role;
grant select, insert, update, delete on public.review_responses to service_role;
grant select, insert, update, delete on public.review_reports to service_role;
grant select, insert, update, delete on public.review_moderation_events to service_role;
