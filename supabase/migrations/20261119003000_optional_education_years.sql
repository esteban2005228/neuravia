-- Education years are no longer asked during onboarding (product decision 2026-11-19).
-- The column stays, nullable, so it can be collected later for norm-based scoring.
alter table public.subjects alter column education_years drop not null;

create or replace function public.complete_onboarding(
  p_role public.user_role,
  p_display_name text,
  p_birth_year int default null,
  p_education_years int default null,
  p_notice_version text default null,
  p_research_consent boolean default false
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_subject_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, role, display_name)
  values (v_uid, p_role, p_display_name);

  if p_role = 'patient' then
    if p_birth_year is null or p_notice_version is null then
      raise exception 'patient_data_required';
    end if;

    insert into public.subjects (user_id, created_by, display_name, birth_year, education_years)
    values (v_uid, v_uid, p_display_name, p_birth_year, p_education_years)
    returning id into v_subject_id;

    insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
    values (v_subject_id, 'service', p_notice_version, 'own_account', v_uid);

    if p_research_consent then
      insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
      values (v_subject_id, 'research', p_notice_version, 'own_account', v_uid);
    end if;
  end if;
end;
$$;
