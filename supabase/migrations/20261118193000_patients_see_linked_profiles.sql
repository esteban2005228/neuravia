-- A patient can see the name and role of the people linked to them.
create policy "profiles_select_linked_by_patient" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.links l
      where l.linked_user_id = profiles.id
        and l.status = 'active'
        and public.is_subject_owner(l.subject_id)
    )
  );
