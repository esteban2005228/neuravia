-- Neuravia phase 1: accounts, evaluated subjects, consent, linking and test results.
-- Every table has RLS enabled. Sensitive writes go through SECURITY DEFINER functions
-- that check the caller with auth.uid().

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('patient', 'professional', 'companion');
create type public.consent_purpose as enum ('service', 'research');
create type public.consent_method as enum ('own_account', 'in_person');
create type public.link_relation as enum ('professional', 'companion');
create type public.link_status as enum ('active', 'revoked');
create type public.assessment_mode as enum ('self', 'professional', 'companion');
create type public.assessment_status as enum ('in_progress', 'completed', 'abandoned');
create type public.result_level as enum ('strength', 'expected', 'watch', 'refer');
create type public.cognitive_domain as enum ('attention', 'memory');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per account (patient, professional or companion).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

-- The person who is evaluated. A patient with an account has user_id set.
-- A patient registered by a companion (no email) has user_id null.
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  birth_year int not null check (birth_year between 1900 and 2100),
  education_years int not null check (education_years between 0 and 30),
  created_at timestamptz not null default now()
);

-- Express consent per purpose (LFPDPPP). Kept as evidence when a subject is deleted.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete set null,
  purpose public.consent_purpose not null,
  notice_version text not null,
  method public.consent_method not null,
  captured_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index consents_subject_idx on public.consents (subject_id);

-- One-time codes a patient shares with a professional or companion.
create table public.link_codes (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '24 hours',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index link_codes_subject_idx on public.link_codes (subject_id);

-- Who can apply tests to a subject and see the results.
create table public.links (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  linked_user_id uuid not null references auth.users (id) on delete cascade,
  relation public.link_relation not null,
  status public.link_status not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (subject_id, linked_user_id)
);
create index links_linked_user_idx on public.links (linked_user_id);

-- Catalog of tests.
create table public.tasks (
  code text primary key,
  domain public.cognitive_domain not null,
  name text not null,
  description text not null,
  version text not null,
  active boolean not null default true
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  mode public.assessment_mode not null,
  administered_by uuid references auth.users (id) on delete set null,
  status public.assessment_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index assessments_subject_idx on public.assessments (subject_id);

create table public.task_runs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  task_code text not null references public.tasks (code),
  task_version text not null,
  trials jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  raw_score numeric not null,
  index_score numeric not null check (index_score between 0 and 100),
  level public.result_level not null,
  completed_at timestamptz not null default now()
);
create index task_runs_assessment_idx on public.task_runs (assessment_id);

-- ---------------------------------------------------------------------------
-- Helper functions (used by policies; SECURITY DEFINER avoids policy recursion)
-- ---------------------------------------------------------------------------
create function public.is_subject_owner(p_subject_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subjects s
    where s.id = p_subject_id and s.user_id = (select auth.uid())
  );
$$;

create function public.can_access_subject(p_subject_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_subject_owner(p_subject_id) or exists (
    select 1 from public.links l
    where l.subject_id = p_subject_id
      and l.linked_user_id = (select auth.uid())
      and l.status = 'active'
  );
$$;

create function public.has_service_consent(p_subject_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.consents c
    where c.subject_id = p_subject_id
      and c.purpose = 'service'
      and c.revoked_at is null
  );
$$;

create function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

-- Patients must be 18 to 45 years old (by birth year).
create function public.check_subject_age()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_age int := extract(year from now())::int - new.birth_year;
begin
  if v_age < 18 or v_age > 45 then
    raise exception 'subject_age_out_of_range' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger subjects_check_age
before insert or update of birth_year on public.subjects
for each row execute function public.check_subject_age();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.consents enable row level security;
alter table public.link_codes enable row level security;
alter table public.links enable row level security;
alter table public.tasks enable row level security;
alter table public.assessments enable row level security;
alter table public.task_runs enable row level security;

-- profiles: each user only their own row.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- subjects: readable by the patient and active linked users; created through functions.
create policy "subjects_select_access" on public.subjects
  for select to authenticated using (public.can_access_subject(id));
create policy "subjects_update_owner" on public.subjects
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke update on public.subjects from authenticated;
grant update (display_name, education_years) on public.subjects to authenticated;

-- consents: readable by whoever can access the subject; created through functions;
-- only the revoked_at column can change.
create policy "consents_select_access" on public.consents
  for select to authenticated using (public.can_access_subject(subject_id));

-- link_codes: only the patient who owns the subject sees and creates them.
create policy "link_codes_select_owner" on public.link_codes
  for select to authenticated using (public.is_subject_owner(subject_id));

-- links: the patient and the linked user see the link.
create policy "links_select_party" on public.links
  for select to authenticated
  using (public.is_subject_owner(subject_id) or linked_user_id = (select auth.uid()));

-- tasks: catalog readable by any signed-in user.
create policy "tasks_select_all" on public.tasks
  for select to authenticated using (true);

-- assessments and task_runs: readable by whoever can access the subject.
create policy "assessments_select_access" on public.assessments
  for select to authenticated using (public.can_access_subject(subject_id));

create policy "task_runs_select_access" on public.task_runs
  for select to authenticated using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and public.can_access_subject(a.subject_id)
    )
  );
create policy "task_runs_insert_access" on public.task_runs
  for insert to authenticated with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id
        and a.status = 'in_progress'
        and a.administered_by = (select auth.uid())
        and public.can_access_subject(a.subject_id)
        and public.has_service_consent(a.subject_id)
    )
  );

-- Anonymous visitors get nothing.
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Functions called by the app (RPC)
-- ---------------------------------------------------------------------------

-- Creates the profile and, for a patient, their own subject + consents.
create function public.complete_onboarding(
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
    if p_birth_year is null or p_education_years is null or p_notice_version is null then
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

-- A companion registers a patient without email. The patient accepts the
-- consent in person on the companion's device.
create function public.create_managed_subject(
  p_display_name text,
  p_birth_year int,
  p_education_years int,
  p_notice_version text,
  p_research_consent boolean default false
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

  insert into public.subjects (user_id, created_by, display_name, birth_year, education_years)
  values (null, v_uid, p_display_name, p_birth_year, p_education_years)
  returning id into v_subject_id;

  insert into public.links (subject_id, linked_user_id, relation)
  values (v_subject_id, v_uid, 'companion');

  insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
  values (v_subject_id, 'service', p_notice_version, 'in_person', v_uid);

  if p_research_consent then
    insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
    values (v_subject_id, 'research', p_notice_version, 'in_person', v_uid);
  end if;

  return v_subject_id;
end;
$$;

-- Patient creates a one-time code (24 h). Older unused codes are invalidated.
create function public.create_link_code()
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
  select id into v_subject_id from public.subjects where user_id = v_uid;
  if v_subject_id is null then
    raise exception 'only_patients';
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

-- A professional or companion redeems a code and becomes linked.
create function public.redeem_link_code(p_code text)
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

  select * into v_code from public.link_codes
  where code = upper(trim(p_code))
  for update;

  if v_code.code is null or v_code.used_at is not null or v_code.expires_at <= now() then
    raise exception 'invalid_or_expired_code';
  end if;

  update public.link_codes set used_at = now(), used_by = v_uid where code = v_code.code;

  insert into public.links (subject_id, linked_user_id, relation)
  values (v_code.subject_id, v_uid, v_role::text::public.link_relation)
  on conflict (subject_id, linked_user_id)
  do update set status = 'active', revoked_at = null, relation = excluded.relation;

  return v_code.subject_id;
end;
$$;

-- The patient, or the linked user themselves, ends a link.
create function public.revoke_link(p_link_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.links l
  set status = 'revoked', revoked_at = now()
  where l.id = p_link_id
    and l.status = 'active'
    and (public.is_subject_owner(l.subject_id) or l.linked_user_id = (select auth.uid()));
  if not found then
    raise exception 'link_not_found';
  end if;
end;
$$;

-- Revoke or grant a consent purpose for a subject the caller controls.
create function public.set_consent(p_subject_id uuid, p_purpose public.consent_purpose, p_granted boolean, p_notice_version text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_method public.consent_method;
begin
  if public.is_subject_owner(p_subject_id) then
    v_method := 'own_account';
  elsif exists (
    select 1 from public.subjects s
    where s.id = p_subject_id and s.user_id is null and s.created_by = v_uid
  ) then
    v_method := 'in_person';
  else
    raise exception 'not_allowed';
  end if;

  update public.consents set revoked_at = now()
  where subject_id = p_subject_id and purpose = p_purpose and revoked_at is null;

  if p_granted then
    insert into public.consents (subject_id, purpose, notice_version, method, captured_by)
    values (p_subject_id, p_purpose, p_notice_version, v_method, v_uid);
  end if;
end;
$$;

-- Starts an assessment. The mode comes from who is applying it.
create function public.start_assessment(p_subject_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_mode public.assessment_mode;
  v_relation public.link_relation;
  v_id uuid;
begin
  if public.is_subject_owner(p_subject_id) then
    v_mode := 'self';
  else
    select relation into v_relation from public.links
    where subject_id = p_subject_id and linked_user_id = v_uid and status = 'active';
    if v_relation is null then
      raise exception 'not_allowed';
    end if;
    v_mode := v_relation::text::public.assessment_mode;
  end if;

  if not public.has_service_consent(p_subject_id) then
    raise exception 'consent_required';
  end if;

  insert into public.assessments (subject_id, mode, administered_by)
  values (p_subject_id, v_mode, v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

-- Marks an assessment as completed (by whoever administered it).
create function public.complete_assessment(p_assessment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.assessments
  set status = 'completed', completed_at = now()
  where id = p_assessment_id
    and administered_by = (select auth.uid())
    and status = 'in_progress';
end;
$$;

-- Deletes the caller's account and every piece of health data tied to it,
-- including patients they registered without email.
create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  delete from public.subjects where user_id is null and created_by = v_uid;
  delete from public.subjects where user_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;

-- Only signed-in users may call the app functions; helpers are internal.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.complete_onboarding(public.user_role, text, int, int, text, boolean),
  public.create_managed_subject(text, int, int, text, boolean),
  public.create_link_code(),
  public.redeem_link_code(text),
  public.revoke_link(uuid),
  public.set_consent(uuid, public.consent_purpose, boolean, text),
  public.start_assessment(uuid),
  public.complete_assessment(uuid),
  public.delete_my_account(),
  public.is_subject_owner(uuid),
  public.can_access_subject(uuid),
  public.has_service_consent(uuid),
  public.my_role()
to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: pilot tasks
-- ---------------------------------------------------------------------------
insert into public.tasks (code, domain, name, description, version) values
  ('A2_flanker', 'attention', 'Flechas (Flanker)',
   'Mide la atención selectiva: indicar hacia dónde apunta la flecha del centro ignorando las de los lados.', '1.0.0'),
  ('M2_digit_span', 'memory', 'Span de dígitos',
   'Mide la memoria a corto plazo: recordar series de números en el mismo orden.', '1.0.0');
