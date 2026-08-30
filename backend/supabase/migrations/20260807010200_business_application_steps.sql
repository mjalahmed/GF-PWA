-- Application wizard steps
create type public.business_application_step_status as enum (
  'pending',
  'in_progress',
  'completed',
  'requires_changes'
);

create table public.business_application_steps (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  step_code text not null,
  status public.business_application_step_status not null default 'pending',
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (application_id, step_code),
  constraint business_application_steps_step_code_check
    check (step_code in (
      'business_information',
      'contact_information',
      'branch_information',
      'documents',
      'review_and_submit'
    ))
);

create index business_application_steps_application_id_idx
  on public.business_application_steps (application_id);

create trigger business_application_steps_set_updated_at
  before update on public.business_application_steps
  for each row
  execute function public.set_updated_at();

create or replace function public.create_business_application_steps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_application_steps (application_id, step_code, status)
  values
    (new.id, 'business_information', 'pending'),
    (new.id, 'contact_information', 'pending'),
    (new.id, 'branch_information', 'pending'),
    (new.id, 'documents', 'pending'),
    (new.id, 'review_and_submit', 'pending');

  return new;
end;
$$;

create trigger business_applications_create_steps
  after insert on public.business_applications
  for each row
  execute function public.create_business_application_steps();
