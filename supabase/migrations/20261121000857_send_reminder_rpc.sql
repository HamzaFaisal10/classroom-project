create or replace function public.send_class_reminder(p_class uuid, p_family uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare c public.classes; n int;
begin
  select * into c from public.classes where id = p_class;
  if c is null then raise exception 'Class not found'; end if;
  if not (public.is_admin() or c.educator_id = auth.uid()) then raise exception 'Not allowed'; end if;
  insert into public.notifications(user_id, title, body, link)
  select family_id, 'Reminder: upcoming class', c.title, '/join/' || c.id
  from public.class_invites where class_id = p_class and (p_family is null or family_id = p_family);
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.send_class_reminder(uuid, uuid) from public, anon;
grant execute on function public.send_class_reminder(uuid, uuid) to authenticated;
