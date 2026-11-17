begin;

create table public.friendships (
  requester uuid not null references public.profiles(id) on delete cascade,
  recipient uuid not null references public.profiles(id) on delete cascade,
  accepted boolean not null default false,
  check (requester <> recipient),
  primary key (requester, recipient)
);
create unique index friendships_pair on public.friendships
  (least(requester, recipient), greatest(requester, recipient));
create index friendships_recipient on public.friendships (recipient);

create table public.profile_blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  check (blocker <> blocked),
  primary key (blocker, blocked)
);

create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles(id) on delete cascade,
  reported uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('Harassment', 'Spam', 'Impersonation', 'Other')),
  details text not null check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  check (reporter <> reported),
  unique (reporter, reported, reason)
);

alter table public.friendships enable row level security;
alter table public.profile_blocks enable row level security;
alter table public.profile_reports enable row level security;
revoke all on public.friendships, public.profile_blocks, public.profile_reports from public, anon, authenticated;

-- Use the caller implicitly so this function cannot inspect unrelated pairs.
create function public.profile_is_blocked(other_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profile_blocks b
    where (b.blocker = auth.uid() and b.blocked = other_id)
       or (b.blocker = other_id and b.blocked = auth.uid())
  );
$$;

create function public.profile_people(search_handle text default null)
returns table (id uuid, name text, handle text, avatar_url text, relationship text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.name, p.handle, p.avatar_url,
    case when b.blocked is not null then 'blocked'
         when f.accepted then 'friend'
         when f.recipient = auth.uid() then 'incoming'
         when f.requester = auth.uid() then 'outgoing'
         else 'none' end
  from public.profiles p
  left join public.profile_blocks b on b.blocker = auth.uid() and b.blocked = p.id
  left join public.friendships f on
    (f.requester = auth.uid() and f.recipient = p.id)
    or (f.recipient = auth.uid() and f.requester = p.id)
  where auth.uid() is not null and p.id <> auth.uid()
    and (b.blocked is not null or not public.profile_is_blocked(p.id))
    and (
      (search_handle is null and (b.blocked is not null or f.requester is not null))
      or (search_handle is not null and lower(p.handle) = lower(trim(search_handle)))
    )
  order by lower(p.name), p.id;
$$;

create function public.change_profile_relationship(person_id uuid, action text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or person_id is null or me = person_id then
    raise exception 'Choose another WayStory account.';
  end if;

  -- Serialize actions on the same pair, regardless of who started the request.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(me, person_id)::text || greatest(me, person_id)::text, 0));

  if action = 'block' then
    insert into public.profile_blocks (blocker, blocked) values (me, person_id)
      on conflict do nothing;
  elsif action = 'unblock' then
    delete from public.profile_blocks where blocker = me and blocked = person_id;
    return;
  elsif action in ('request', 'accept') and public.profile_is_blocked(person_id) then
    raise exception 'This account is unavailable.';
  elsif action = 'request' then
    insert into public.friendships (requester, recipient) values (me, person_id)
      on conflict do nothing;
    return;
  elsif action = 'accept' then
    update public.friendships set accepted = true where requester = person_id and recipient = me;
    return;
  elsif action <> 'remove' or action is null then
    raise exception 'Unknown relationship action.';
  end if;

  delete from public.friendships
   where (requester = me and recipient = person_id)
      or (requester = person_id and recipient = me);
end;
$$;

create function public.report_profile(person_id uuid, report_reason text, report_details text)
returns void language sql security definer set search_path = ''
as $$
  insert into public.profile_reports (reporter, reported, reason, details)
  values (auth.uid(), person_id, report_reason, trim(report_details))
  on conflict (reporter, reported, reason) do nothing;
$$;

revoke execute on function public.profile_is_blocked(uuid), public.profile_people(text),
  public.change_profile_relationship(uuid, text), public.report_profile(uuid, text, text)
from public, anon;
grant execute on function public.profile_is_blocked(uuid), public.profile_people(text),
  public.change_profile_relationship(uuid, text), public.report_profile(uuid, text, text)
to authenticated;

-- Restrictive policies supplement the existing trip membership policies.
create policy track_points_profile_blocks on public.track_points as restrictive
  for select to authenticated using (not public.profile_is_blocked(user_id));
create policy trip_members_profile_blocks on public.trip_members as restrictive
  for select to authenticated using (not public.profile_is_blocked(user_id));
create policy stops_profile_blocks on public.stops as restrictive
  for select to authenticated using (not public.profile_is_blocked(author_id));
create policy photos_profile_blocks on public.photos as restrictive
  for select to authenticated using (not public.profile_is_blocked(author_id));

create function public.check_trip_invite_block()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  trip_owner uuid;
begin
  select owner_id into trip_owner from public.trips where id = new.trip_id;

  if public.profile_is_blocked(new.user_id) or public.profile_is_blocked(trip_owner)
    or exists (
      select 1 from public.profile_blocks b
      where (b.blocker = trip_owner and b.blocked = new.user_id)
         or (b.blocker = new.user_id and b.blocked = trip_owner)
    ) then
    raise exception 'This traveler cannot join the trip.';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_trip_invite_block() from public, anon, authenticated;
create trigger check_trip_invite_block before insert on public.trip_members
  for each row execute function public.check_trip_invite_block();

commit;
