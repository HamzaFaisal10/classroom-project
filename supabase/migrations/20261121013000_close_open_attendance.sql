-- Rejoining closes the user's previous open attendance row for that class.
create or replace function public.attendance_close_previous() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.attendance set left_at = now()
  where class_id = new.class_id and user_id = new.user_id and left_at is null;
  return new;
end $$;
revoke execute on function public.attendance_close_previous() from public, anon, authenticated;
create trigger attendance_close_previous before insert on public.attendance for each row execute function public.attendance_close_previous();

-- Ending a class closes everyone's open attendance.
create or replace function public.attendance_close_on_end() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'ended' and old.status <> 'ended' then
    update public.attendance set left_at = coalesce(new.ended_at, now()) where class_id = new.id and left_at is null;
  end if;
  return new;
end $$;
revoke execute on function public.attendance_close_on_end() from public, anon, authenticated;
create trigger attendance_close_on_end after update of status on public.classes for each row execute function public.attendance_close_on_end();
