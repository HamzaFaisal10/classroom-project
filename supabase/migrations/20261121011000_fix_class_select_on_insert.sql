-- A just-inserted class must be readable by its own educator (needed for INSERT ... RETURNING).
drop policy classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (educator_id = auth.uid() or public.can_see_class(id));
