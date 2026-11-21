-- Profiles: non-admin users can never change role, active, educator or email.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role; new.active := old.active; new.educator_id := old.educator_id; new.email := old.email; new.id := old.id;
  end if;
  return new;
end $$;
revoke execute on function public.profiles_guard() from public, anon, authenticated;

-- Class invites: API users may only change the RSVP column.
revoke update on public.class_invites from anon, authenticated;
grant update (rsvp) on public.class_invites to authenticated;

-- Attendance: API users may only set when they left.
revoke update on public.attendance from anon, authenticated;
grant update (left_at) on public.attendance to authenticated;

-- Notifications: users may only mark as read.
revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- Classes: nobody can rewrite who created a class.
revoke update on public.classes from anon, authenticated;
grant update (title, description, educator_id, starts_at, duration_min, status, started_at, ended_at) on public.classes to authenticated;
