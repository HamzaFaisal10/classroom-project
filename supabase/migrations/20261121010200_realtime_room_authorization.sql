-- Only people who can see a class may join its private live-room channel ("room:<class id>").
create or replace function public.can_join_room(p_topic text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_topic ~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and public.can_see_class(substring(p_topic from 6)::uuid)
$$;
revoke execute on function public.can_join_room(text) from public, anon;
grant execute on function public.can_join_room(text) to authenticated;

create policy "room members can receive" on realtime.messages for select to authenticated
  using (public.can_join_room(realtime.topic()));
create policy "room members can send" on realtime.messages for insert to authenticated
  with check (public.can_join_room(realtime.topic()));
