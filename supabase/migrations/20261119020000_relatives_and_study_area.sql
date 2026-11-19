-- Phase 1 adjustments requested on 2026-11-19:
-- 1. Professionals pick their study area.
-- 2. Companions care for at most 2 relatives, each with a kinship.
-- 3. Companions can create link codes for relatives they registered without
--    email, so a doctor or another relative can link to them.

-- 1. Study area ---------------------------------------------------------------
alter table public.profiles
  add column study_area text
  check (study_area in (
    'clinical_psychology', 'neuropsychology', 'psychiatry', 'neurology',
    'general_medicine', 'psychology_student', 'other'
  ));

revoke update on public.profiles from authenticated;
grant update (display_name, study_area) on public.profiles to authenticated;

-- 2. Kinship and the 2-relative limit -------------------------------------------
create type public.kinship as enum (
  'mother', 'father', 'child', 'sibling', 'partner', 'grandparent', 'uncle_aunt', 'cousin', 'other'
);

alter table public.links add column kinship public.kinship;

create function public.enforce_companion_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.relation = 'companion' and new.status = 'active' then
    if (
      select count(*) from public.links
      where linked_user_id = new.linked_user_id
        and relation = 'companion'
        and status = 'active'
        and id <> new.id
    ) >= 2 then
      raise exception 'companion_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

create trigger links_companion_limit
  before insert or update of status, relation on public.links
  for each row execute function public.enforce_companion_limit();

-- create_managed_subject gains the kinship.
drop function public.create_managed_subject(text, int, int, text, boolean);

create function public.create_managed_subject(
  p_display_name text,
  p_birth_year int,
  p_education_years int,
  p_notice_version text,
  p_research_consent boolean default false,
  p_kinship public.kinship default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_subject_id uuid;
begin
  if public.my_role() is distinct from 'companion' then
    raise exception 'only_companions';
  end if;
  if p_kinship is null then
    raise exception 'kinship_required';
  end if;

  insert into public.subjects (user_id, created_by, display_name, birth_year, education_years)
  values (null, v_uid, p_display_name, p_birth_year, p_education_years)
  returning id into v_subject_id;

  insert into public.links (subject_id, linked_user_id, relation, kinship)
  values (v_subject_id, v_uid, 'companion', p_kinship);

  insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
  values (v_subject_id, 'service', p_notice_version, 'in_person', v_uid);

  if p_research_consent then
    insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
    values (v_subject_id, 'research', p_notice_version, 'in_person', v_uid);
  end if;

  return v_subject_id;
end;
$$;

-- redeem_link_code gains the kinship (required when a companion redeems).
drop function public.redeem_link_code(text);

create function public.redeem_link_code(p_code text, p_kinship public.kinship default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.my_role();
  v_code public.link_codes%rowtype;
begin
  if v_role is null or v_role = 'patient' then
    raise exception 'only_professionals_or_companions';
  end if;
  if v_role = 'companion' and p_kinship is null then
    raise exception 'kinship_required';
  end if;

  select * into v_code from public.link_codes
  where code = upper(trim(p_code))
  for update;

  if v_code.code is null or v_code.used_at is not null or v_code.expires_at <= now() then
    raise exception 'invalid_or_expired_code';
  end if;

  update public.link_codes set used_at = now(), used_by = v_uid where code = v_code.code;

  insert into public.links (subject_id, linked_user_id, relation, kinship)
  values (
    v_code.subject_id, v_uid, v_role::text::public.link_relation,
    case when v_role = 'companion' then p_kinship end
  )
  on conflict (subject_id, linked_user_id)
  do update set status = 'active', revoked_at = null, relation = excluded.relation, kinship = excluded.kinship;

  return v_code.subject_id;
end;
$$;

-- 3. Link codes from a companion -------------------------------------------------
-- Without a subject: the patient's own code (unchanged behaviour).
-- With a subject: a companion with an active link to a relative they registered
-- without email (consent captured in person). Relatives with their own account
-- decide themselves who sees their data.
drop function public.create_link_code();

create function public.create_link_code(p_subject_id uuid default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_subject_id uuid;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
begin
  if p_subject_id is null then
    select id into v_subject_id from public.subjects where user_id = v_uid;
    if v_subject_id is null then
      raise exception 'only_patients';
    end if;
  else
    select s.id into v_subject_id
    from public.subjects s
    join public.links l on l.subject_id = s.id
    where s.id = p_subject_id
      and s.user_id is null
      and l.linked_user_id = v_uid
      and l.relation = 'companion'
      and l.status = 'active';
    if v_subject_id is null then
      raise exception 'not_allowed';
    end if;
  end if;

  update public.link_codes set expires_at = now()
  where subject_id = v_subject_id and used_at is null and expires_at > now();

  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.link_codes (code, subject_id) values (v_code, v_subject_id);
      exit;
    exception when unique_violation then
      -- try another code
    end;
  end loop;

  return v_code;
end;
$$;

revoke execute on function
  public.create_managed_subject(text, int, int, text, boolean, public.kinship),
  public.redeem_link_code(text, public.kinship),
  public.create_link_code(uuid),
  public.enforce_companion_limit()
from public, anon;

grant execute on function
  public.create_managed_subject(text, int, int, text, boolean, public.kinship),
  public.redeem_link_code(text, public.kinship),
  public.create_link_code(uuid)
to authenticated;
