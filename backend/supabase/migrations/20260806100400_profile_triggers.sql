-- Auto-create profile + default customer role; guard privileged profile fields
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_role_id uuid;
begin
  insert into public.profiles (
    id,
    full_name,
    preferred_language,
    status
  )
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en'),
    'active'
  );

  select id into customer_role_id
  from public.roles
  where code = 'customer'
  limit 1;

  if customer_role_id is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (new.id, customer_role_id, new.id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.enforce_profile_update_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.status is distinct from old.status then
      if not (
        public.has_permission('user.suspend')
        or public.has_role('super_admin')
      ) then
        raise exception 'PERMISSION_DENIED: profile status cannot be changed by client'
          using errcode = '42501';
      end if;
    end if;

    if new.id is distinct from old.id then
      raise exception 'PERMISSION_DENIED: profile id is immutable'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_update_guards
  before update on public.profiles
  for each row
  execute function public.enforce_profile_update_guards();
