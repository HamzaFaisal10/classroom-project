create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('admin','educator','family');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.user_role not null,
  phone text,
  timezone text,
  children text,
  educator_id uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_invites (
  token uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  role public.user_role not null,
  educator_id uuid references public.profiles(id) on delete set null,
  children text,
  kind text not null default 'invite' check (kind in ('invite','reset')),
  user_id uuid references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  cancelled boolean not null default false
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  educator_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min > 0 and duration_min <= 480),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.classes(educator_id, starts_at);

create table public.class_invites (
  class_id uuid not null references public.classes(id) on delete cascade,
  family_id uuid not null references public.profiles(id) on delete cascade,
  rsvp text not null default 'pending' check (rsvp in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  primary key (class_id, family_id)
);
create index on public.class_invites(family_id);

create table public.attendance (
  id bigint generated always as identity primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);
create index on public.attendance(class_id);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);

create table public.settings (
  id int primary key default 1 check (id = 1),
  org_name text not null default 'Classroom',
  support_email text,
  default_duration int not null default 60,
  waiting_room boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.settings default values;

-- helpers
create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid() and active), false)
$$;
create or replace function public.can_see_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or exists (select 1 from public.classes c where c.id = p_class and c.educator_id = auth.uid())
    or exists (select 1 from public.class_invites i where i.class_id = p_class and i.family_id = auth.uid())
$$;
create or replace function public.is_class_educator(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = p_class and c.educator_id = auth.uid())
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_invites enable row level security;
alter table public.classes enable row level security;
alter table public.class_invites enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or role in ('educator','admin')
  or (public.my_role() = 'educator' and (
        educator_id = auth.uid()
        or exists (select 1 from public.class_invites i join public.classes c on c.id = i.class_id
                   where i.family_id = profiles.id and c.educator_id = auth.uid())))
  or (public.my_role() = 'family' and exists (
        select 1 from public.attendance a1 join public.attendance a2 on a1.class_id = a2.class_id
        where a1.user_id = auth.uid() and a2.user_id = profiles.id))
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy invites_admin on public.user_invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy classes_select on public.classes for select to authenticated using (public.can_see_class(id));
create policy classes_insert on public.classes for insert to authenticated with check (
  public.is_admin() or (public.my_role() = 'educator' and educator_id = auth.uid()));
create policy classes_update on public.classes for update to authenticated
  using (public.is_admin() or educator_id = auth.uid())
  with check (public.is_admin() or educator_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated
  using (public.is_admin() or educator_id = auth.uid());

create policy ci_select on public.class_invites for select to authenticated using (
  family_id = auth.uid() or public.is_admin() or public.is_class_educator(class_id));
create policy ci_insert on public.class_invites for insert to authenticated with check (
  public.is_admin() or public.is_class_educator(class_id));
create policy ci_update on public.class_invites for update to authenticated
  using (family_id = auth.uid() or public.is_admin() or public.is_class_educator(class_id));
create policy ci_delete on public.class_invites for delete to authenticated using (
  public.is_admin() or public.is_class_educator(class_id));

create policy att_select on public.attendance for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.is_class_educator(class_id));
create policy att_insert on public.attendance for insert to authenticated with check (
  user_id = auth.uid() and public.can_see_class(class_id));
create policy att_update on public.attendance for update to authenticated using (user_id = auth.uid());

create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on public.notifications for update to authenticated using (user_id = auth.uid());
create policy notif_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

create policy settings_select on public.settings for select to authenticated using (true);
create policy settings_update on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- guard: non-admins cannot change privileged profile columns
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and current_user = 'authenticated' then
    new.role := old.role; new.active := old.active; new.educator_id := old.educator_id; new.email := old.email;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

-- notifications
create or replace function public.notify_invite() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select title, starts_at into c from public.classes where id = new.class_id;
  insert into public.notifications(user_id, title, body, link)
  values (new.family_id, 'New class invitation', c.title, '/join/' || new.class_id);
  return new;
end $$;
create trigger class_invite_notify after insert on public.class_invites for each row execute function public.notify_invite();

create or replace function public.notify_class_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare msg text;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then msg := 'Class cancelled';
  elsif new.status = 'live' and old.status <> 'live' then msg := 'Class is live now';
  elsif new.starts_at <> old.starts_at or new.duration_min <> old.duration_min then msg := 'Class time changed';
  else return new; end if;
  insert into public.notifications(user_id, title, body, link)
  select family_id, msg, new.title, '/join/' || new.id from public.class_invites where class_id = new.id;
  return new;
end $$;
create trigger class_change_notify after update on public.classes for each row execute function public.notify_class_change();

-- auth user creation (internal, not callable from the API)
create or replace function public._create_auth_user(p_email text, p_password text, p_name text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name), now(), now(),
    '', '', '', '', '', '', '', '', false, false);
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', lower(p_email), 'email_verified', true),
    'email', now(), now(), now());
  return uid;
end $$;
revoke all on function public._create_auth_user(text,text,text) from public, anon, authenticated;

-- invite RPCs
create or replace function public.get_invite(p_token uuid)
returns table(email text, full_name text, role public.user_role, kind text, valid boolean)
language sql stable security definer set search_path = public as $$
  select email, full_name, role, kind,
         (used_at is null and not cancelled and expires_at > now()) as valid
  from public.user_invites where token = p_token
$$;
grant execute on function public.get_invite(uuid) to anon, authenticated;

create or replace function public.accept_invite(p_token uuid, p_password text, p_full_name text default null)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare inv public.user_invites; uid uuid;
begin
  select * into inv from public.user_invites where token = p_token for update;
  if inv is null or inv.used_at is not null or inv.cancelled or inv.expires_at < now() then
    raise exception 'This link is invalid or has expired';
  end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  if inv.kind = 'invite' then
    if exists (select 1 from auth.users where email = lower(inv.email)) then
      raise exception 'An account with this email already exists';
    end if;
    uid := public._create_auth_user(inv.email, p_password, coalesce(nullif(p_full_name,''), inv.full_name));
    insert into public.profiles(id, email, full_name, role, educator_id, children)
    values (uid, lower(inv.email), coalesce(nullif(p_full_name,''), inv.full_name), inv.role, inv.educator_id, inv.children);
  else
    update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
    where id = inv.user_id;
  end if;
  update public.user_invites set used_at = now() where token = p_token;
  return lower(inv.email);
end $$;
grant execute on function public.accept_invite(uuid, text, text) to anon, authenticated;

create or replace function public.admin_create_invite(p_email text, p_full_name text, p_role public.user_role,
  p_educator_id uuid default null, p_children text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not public.is_admin() then raise exception 'Only admins can invite users'; end if;
  if exists (select 1 from public.profiles where email = lower(p_email)) then
    raise exception 'A user with this email already exists';
  end if;
  update public.user_invites set cancelled = true where lower(email) = lower(p_email) and used_at is null and kind = 'invite';
  insert into public.user_invites(email, full_name, role, educator_id, children, created_by)
  values (lower(p_email), p_full_name, p_role, p_educator_id, p_children, auth.uid()) returning token into t;
  return t;
end $$;
grant execute on function public.admin_create_invite(text,text,public.user_role,uuid,text) to authenticated;

create or replace function public.admin_reset_link(p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid; p public.profiles;
begin
  if not public.is_admin() then raise exception 'Only admins can reset passwords'; end if;
  select * into p from public.profiles where id = p_user;
  if p is null then raise exception 'User not found'; end if;
  insert into public.user_invites(email, full_name, role, kind, user_id, created_by, expires_at)
  values (p.email, p.full_name, p.role, 'reset', p.id, auth.uid(), now() + interval '2 days') returning token into t;
  return t;
end $$;
grant execute on function public.admin_reset_link(uuid) to authenticated;

revoke execute on function public.my_role() from anon;
revoke execute on function public.is_admin() from anon;
