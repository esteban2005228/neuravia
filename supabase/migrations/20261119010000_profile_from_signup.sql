-- Sign-up now collects role, name, birth year and consent BEFORE the account
-- exists. The browser sends them as user metadata in auth.signUp(); this
-- trigger turns them into the profile, the subject and the consent rows in the
-- same transaction that creates the auth user, so consent is tied to the
-- account from the start.
--
-- Safety:
-- - Metadata is user-controlled, so everything is validated here again.
-- - Any problem is swallowed: sign-up never fails because of it, and the user
--   simply lands on /onboarding to finish setup.
-- - Name and birth year are removed from the auth metadata afterwards so they
--   live only in RLS-protected tables (data minimisation).

create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_name text := nullif(btrim(m ->> 'display_name'), '');
  v_notice text := nullif(m ->> 'notice_version', '');
  v_subject_id uuid;
begin
  begin
    if v_name is null or v_notice is null or (m ->> 'terms_accepted') is distinct from 'true' then
      return new;
    end if;
    v_role := (m ->> 'role')::public.user_role;

    insert into public.profiles (id, role, display_name)
    values (new.id, v_role, left(v_name, 80));

    if v_role = 'patient' then
      insert into public.subjects (user_id, created_by, display_name, birth_year)
      values (new.id, new.id, left(v_name, 80), (m ->> 'birth_year')::int)
      returning id into v_subject_id;

      insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
      values (v_subject_id, 'service', v_notice, 'own_account', new.id);

      if (m ->> 'research_consent') = 'true' then
        insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
        values (v_subject_id, 'research', v_notice, 'own_account', new.id);
      end if;
    end if;

    update auth.users
    set raw_user_meta_data = raw_user_meta_data
      - 'display_name' - 'birth_year' - 'role' - 'terms_accepted' - 'research_consent' - 'notice_version'
    where id = new.id;
  exception when others then
    -- Invalid or partial data: the whole block is rolled back and the user
    -- completes setup on /onboarding instead.
    return new;
  end;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
