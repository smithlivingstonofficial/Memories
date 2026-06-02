-- RLS policies for the app tables that do not already have table-local policies.
-- Run after the base table files and after public.profiles exists.

-- Keep this script rerunnable even if an earlier run created helper functions
-- with different argument names.
drop policy if exists "Friends can view shared memories" on public.memories;
drop policy if exists "Inner circle can view shared memories" on public.memories;
drop policy if exists "Users can view memory media for visible memories" on public.memory_media;
drop policy if exists "Users can view assets attached to visible memories" on public.media_assets;
drop policy if exists "Users can view assets attached to visible moments" on public.media_assets;
drop policy if exists "Users can view likes on visible memories" on public.memory_likes;
drop policy if exists "Users can like visible memories as themselves" on public.memory_likes;
drop policy if exists "Users can view reflections on visible memories" on public.memory_reflections;
drop policy if exists "Users can reflect on visible memories as themselves" on public.memory_reflections;
drop policy if exists "Users can view visible moments" on public.moments;
drop policy if exists "Users can view media for visible moments" on public.moment_media;
drop policy if exists "Users can create media for their own moments" on public.moment_media;
drop policy if exists "Users can mark visible moments as viewed" on public.moment_views;
drop policy if exists "Users can refresh their own moment views" on public.moment_views;
drop policy if exists "Users can view conversations they belong to" on public.conversations;
drop policy if exists "Conversation members can update conversations" on public.conversations;
drop policy if exists "Users can view members for their conversations" on public.conversation_members;
drop policy if exists "Conversation members can view messages" on public.messages;
drop policy if exists "Conversation members can send messages as themselves" on public.messages;

drop function if exists public.is_inner_circle_member(uuid, uuid);
drop function if exists public.has_accepted_follow(uuid, uuid);
drop function if exists public.can_view_memory(uuid);
drop function if exists public.can_view_memory(uuid, uuid);
drop function if exists public.can_engage_with_memory(uuid);
drop function if exists public.can_engage_with_memory(uuid, uuid);
drop function if exists public.can_view_moment(uuid);
drop function if exists public.can_view_moment(uuid, uuid);
drop function if exists public.is_conversation_member(uuid, uuid);

create or replace function public.is_inner_circle_member(
  target_owner_id uuid,
  target_member_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.inner_circle_members icm
    where icm.owner_id = target_owner_id
      and icm.member_id = target_member_id
      and icm.status = 'accepted'
  );
$$;

create or replace function public.has_accepted_follow(
  target_follower_id uuid,
  target_following_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_follows uf
    where uf.follower_id = target_follower_id
      and uf.following_id = target_following_id
      and uf.status = 'accepted'
  );
$$;

create or replace function public.can_view_memory(
  target_memory_id uuid,
  viewer_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memories m
    where m.id = target_memory_id
      and (
        m.owner_id = viewer_id
        or m.privacy = 'public'
        or (
          m.privacy = 'friends'
          and public.has_accepted_follow(viewer_id, m.owner_id)
        )
        or (
          m.privacy = 'inner_circle'
          and public.is_inner_circle_member(m.owner_id, viewer_id)
        )
      )
  );
$$;

create or replace function public.can_engage_with_memory(
  target_memory_id uuid,
  viewer_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memories m
    where m.id = target_memory_id
      and m.privacy <> 'vault'
      and public.can_view_memory(m.id, viewer_id)
  );
$$;

create or replace function public.can_view_moment(
  target_moment_id uuid,
  viewer_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.moments mo
    where mo.id = target_moment_id
      and (
        mo.owner_id = viewer_id
        or (
          mo.is_archived = false
          and mo.cleanup_status = 'active'
          and mo.expires_at > now()
          and (
            mo.visibility = 'public'
            or (
              mo.visibility = 'followers'
              and public.has_accepted_follow(viewer_id, mo.owner_id)
            )
            or (
              mo.visibility = 'inner_circle'
              and public.is_inner_circle_member(mo.owner_id, viewer_id)
            )
          )
        )
      )
  );
$$;

create or replace function public.is_conversation_member(
  target_conversation_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = target_user_id
  );
$$;

revoke all on function public.is_inner_circle_member(uuid, uuid) from public;
revoke all on function public.has_accepted_follow(uuid, uuid) from public;
revoke all on function public.can_view_memory(uuid, uuid) from public;
revoke all on function public.can_engage_with_memory(uuid, uuid) from public;
revoke all on function public.can_view_moment(uuid, uuid) from public;
revoke all on function public.is_conversation_member(uuid, uuid) from public;

grant execute on function public.is_inner_circle_member(uuid, uuid) to authenticated;
grant execute on function public.has_accepted_follow(uuid, uuid) to authenticated;
grant execute on function public.can_view_memory(uuid, uuid) to authenticated;
grant execute on function public.can_engage_with_memory(uuid, uuid) to authenticated;
grant execute on function public.can_view_moment(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

-- Extend memory/media visibility beyond owner + public for friends and inner circle.

drop policy if exists "Friends can view shared memories" on public.memories;
create policy "Friends can view shared memories"
  on public.memories
  for select
  to authenticated
  using (
    privacy = 'friends'
    and public.has_accepted_follow(auth.uid(), owner_id)
  );

drop policy if exists "Inner circle can view shared memories" on public.memories;
create policy "Inner circle can view shared memories"
  on public.memories
  for select
  to authenticated
  using (
    privacy = 'inner_circle'
    and public.is_inner_circle_member(owner_id, auth.uid())
  );

drop policy if exists "Users can view memory media for visible memories" on public.memory_media;
create policy "Users can view memory media for visible memories"
  on public.memory_media
  for select
  to authenticated
  using (public.can_view_memory(memory_id, auth.uid()));

drop policy if exists "Users can view assets attached to visible memories" on public.media_assets;
create policy "Users can view assets attached to visible memories"
  on public.media_assets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memory_media mm
      where mm.asset_id = media_assets.id
        and public.can_view_memory(mm.memory_id, auth.uid())
    )
  );

drop policy if exists "Users can view assets attached to visible moments" on public.media_assets;
create policy "Users can view assets attached to visible moments"
  on public.media_assets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.moment_media mom
      where mom.object_key = media_assets.object_key
        and public.can_view_moment(mom.moment_id, auth.uid())
    )
  );

-- Social graph.

alter table public.user_follows enable row level security;

drop policy if exists "Users can view follows they participate in" on public.user_follows;
create policy "Users can view follows they participate in"
  on public.user_follows
  for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "Accepted follows are viewable for profile stats" on public.user_follows;
create policy "Accepted follows are viewable for profile stats"
  on public.user_follows
  for select
  to authenticated
  using (status = 'accepted');

drop policy if exists "Users can create their own follows" on public.user_follows;
create policy "Users can create their own follows"
  on public.user_follows
  for insert
  to authenticated
  with check (
    auth.uid() = follower_id
    and follower_id <> following_id
    and status in ('pending', 'accepted')
  );

drop policy if exists "Users can update follow rows they control" on public.user_follows;
create policy "Users can update follow rows they control"
  on public.user_follows
  for update
  to authenticated
  using (
    (
      auth.uid() = follower_id
      and status <> 'blocked'
    )
    or auth.uid() = following_id
  )
  with check (
    follower_id <> following_id
    and (
      (
        auth.uid() = follower_id
        and status in ('pending', 'accepted')
      )
      or auth.uid() = following_id
    )
  );

drop policy if exists "Users can delete follow rows they participate in" on public.user_follows;
create policy "Users can delete follow rows they participate in"
  on public.user_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

alter table public.inner_circle_members enable row level security;

drop policy if exists "Users can view inner circle rows they participate in" on public.inner_circle_members;
create policy "Users can view inner circle rows they participate in"
  on public.inner_circle_members
  for select
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = member_id);

drop policy if exists "Users can add members to their inner circle" on public.inner_circle_members;
create policy "Users can add members to their inner circle"
  on public.inner_circle_members
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and owner_id <> member_id
  );

drop policy if exists "Users can update their inner circle members" on public.inner_circle_members;
create policy "Users can update their inner circle members"
  on public.inner_circle_members
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and owner_id <> member_id
  );

drop policy if exists "Users can remove inner circle rows they participate in" on public.inner_circle_members;
create policy "Users can remove inner circle rows they participate in"
  on public.inner_circle_members
  for delete
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = member_id);

-- Memory likes and reflections.

alter table public.memory_likes enable row level security;

drop policy if exists "Users can view likes on visible memories" on public.memory_likes;
create policy "Users can view likes on visible memories"
  on public.memory_likes
  for select
  to authenticated
  using (public.can_view_memory(memory_id, auth.uid()));

drop policy if exists "Users can like visible memories as themselves" on public.memory_likes;
create policy "Users can like visible memories as themselves"
  on public.memory_likes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_engage_with_memory(memory_id, auth.uid())
  );

drop policy if exists "Users can delete their own likes" on public.memory_likes;
create policy "Users can delete their own likes"
  on public.memory_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

alter table public.memory_reflections enable row level security;

drop policy if exists "Users can view reflections on visible memories" on public.memory_reflections;
create policy "Users can view reflections on visible memories"
  on public.memory_reflections
  for select
  to authenticated
  using (public.can_view_memory(memory_id, auth.uid()));

drop policy if exists "Users can reflect on visible memories as themselves" on public.memory_reflections;
create policy "Users can reflect on visible memories as themselves"
  on public.memory_reflections
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_engage_with_memory(memory_id, auth.uid())
  );

drop policy if exists "Users can update their own reflections" on public.memory_reflections;
create policy "Users can update their own reflections"
  on public.memory_reflections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete reflections they own or received" on public.memory_reflections;
create policy "Users can delete reflections they own or received"
  on public.memory_reflections
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.memories m
      where m.id = memory_reflections.memory_id
        and m.owner_id = auth.uid()
    )
  );

-- Moments.

alter table public.moments enable row level security;

drop policy if exists "Users can view visible moments" on public.moments;
create policy "Users can view visible moments"
  on public.moments
  for select
  to authenticated
  using (public.can_view_moment(id, auth.uid()));

drop policy if exists "Users can create their own moments" on public.moments;
create policy "Users can create their own moments"
  on public.moments
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own moments" on public.moments;
create policy "Users can update their own moments"
  on public.moments
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own moments" on public.moments;
create policy "Users can delete their own moments"
  on public.moments
  for delete
  to authenticated
  using (auth.uid() = owner_id);

alter table public.moment_media enable row level security;

drop policy if exists "Users can view media for visible moments" on public.moment_media;
create policy "Users can view media for visible moments"
  on public.moment_media
  for select
  to authenticated
  using (public.can_view_moment(moment_id, auth.uid()));

drop policy if exists "Users can create media for their own moments" on public.moment_media;
create policy "Users can create media for their own moments"
  on public.moment_media
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.moments mo
      where mo.id = moment_media.moment_id
        and mo.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own moment media" on public.moment_media;
create policy "Users can update their own moment media"
  on public.moment_media
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own moment media" on public.moment_media;
create policy "Users can delete their own moment media"
  on public.moment_media
  for delete
  to authenticated
  using (auth.uid() = owner_id);

alter table public.moment_views enable row level security;

drop policy if exists "Users can view moment view rows they own or received" on public.moment_views;
create policy "Users can view moment view rows they own or received"
  on public.moment_views
  for select
  to authenticated
  using (
    auth.uid() = viewer_id
    or exists (
      select 1
      from public.moments mo
      where mo.id = moment_views.moment_id
        and mo.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can mark visible moments as viewed" on public.moment_views;
create policy "Users can mark visible moments as viewed"
  on public.moment_views
  for insert
  to authenticated
  with check (
    auth.uid() = viewer_id
    and public.can_view_moment(moment_id, auth.uid())
    and not exists (
      select 1
      from public.moments mo
      where mo.id = moment_views.moment_id
        and mo.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can refresh their own moment views" on public.moment_views;
create policy "Users can refresh their own moment views"
  on public.moment_views
  for update
  to authenticated
  using (auth.uid() = viewer_id)
  with check (
    auth.uid() = viewer_id
    and public.can_view_moment(moment_id, auth.uid())
  );

-- Direct conversations and messages.

alter table public.conversations enable row level security;

drop policy if exists "Users can view conversations they belong to" on public.conversations;
create policy "Users can view conversations they belong to"
  on public.conversations
  for select
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_conversation_member(id, auth.uid())
  );

drop policy if exists "Users can create their own conversations" on public.conversations;
create policy "Users can create their own conversations"
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "Conversation members can update conversations" on public.conversations;
create policy "Conversation members can update conversations"
  on public.conversations
  for update
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_conversation_member(id, auth.uid())
  )
  with check (
    auth.uid() = created_by
    or public.is_conversation_member(id, auth.uid())
  );

alter table public.conversation_members enable row level security;

drop policy if exists "Users can view members for their conversations" on public.conversation_members;
create policy "Users can view members for their conversations"
  on public.conversation_members
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_conversation_member(conversation_id, auth.uid())
  );

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
  on public.conversation_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.conversations c
      where c.id = conversation_members.conversation_id
        and c.created_by = auth.uid()
    )
  );

drop policy if exists "Users can update their own conversation membership" on public.conversation_members;
create policy "Users can update their own conversation membership"
  on public.conversation_members
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave their conversations" on public.conversation_members;
create policy "Users can leave their conversations"
  on public.conversation_members
  for delete
  to authenticated
  using (auth.uid() = user_id);

alter table public.messages enable row level security;

drop policy if exists "Conversation members can view messages" on public.messages;
create policy "Conversation members can view messages"
  on public.messages
  for select
  to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "Conversation members can send messages as themselves" on public.messages;
create policy "Conversation members can send messages as themselves"
  on public.messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id, auth.uid())
  );

drop policy if exists "Users can update their own messages" on public.messages;
create policy "Users can update their own messages"
  on public.messages
  for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

drop policy if exists "Users can delete their own messages" on public.messages;
create policy "Users can delete their own messages"
  on public.messages
  for delete
  to authenticated
  using (auth.uid() = sender_id);

notify pgrst, 'reload schema';
