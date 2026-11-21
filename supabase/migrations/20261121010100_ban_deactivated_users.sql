create or replace function public.sync_user_ban() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if new.active is distinct from old.active then
    update auth.users set banned_until = case when new.active then null else 'infinity'::timestamptz end where id = new.id;
    if not new.active then delete from auth.sessions where user_id = new.id; end if;
  end if;
  return new;
end $$;
revoke execute on function public.sync_user_ban() from public, anon, authenticated;
create trigger profiles_sync_ban after update of active on public.profiles for each row execute function public.sync_user_ban();
