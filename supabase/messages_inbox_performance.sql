-- Messages inbox performance helper for Memories.
-- Run this in the Supabase SQL Editor. Safe to run repeatedly.

create index if not exists conversation_members_conversation_user_idx
  on public.conversation_members using btree (conversation_id, user_id);

create index if not exists conversation_members_user_conversation_read_idx
  on public.conversation_members using btree (user_id, conversation_id, last_read_at);

create index if not exists messages_conversation_created_id_idx
  on public.messages using btree (conversation_id, created_at desc, id desc);

create or replace function public.get_messages_inbox(viewer uuid)
returns table (
  conversation_id uuid,
  conversation_updated_at timestamptz,
  other_user_id uuid,
  other_username text,
  other_full_name text,
  other_avatar_url text,
  last_message_id uuid,
  last_message_body text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with my_memberships as (
    select conversation_id, last_read_at
    from public.conversation_members
    where user_id = viewer
  ),
  other_members as (
    select distinct on (cm.conversation_id)
      cm.conversation_id,
      cm.user_id
    from public.conversation_members cm
    join my_memberships mm on mm.conversation_id = cm.conversation_id
    where cm.user_id <> viewer
    order by cm.conversation_id, cm.user_id
  )
  select
    c.id as conversation_id,
    c.updated_at as conversation_updated_at,
    om.user_id as other_user_id,
    pp.username as other_username,
    pp.full_name as other_full_name,
    pp.avatar_url as other_avatar_url,
    lm.id as last_message_id,
    lm.body as last_message_body,
    lm.created_at as last_message_created_at,
    lm.sender_id as last_message_sender_id,
    coalesce(unread.total, 0) as unread_count
  from my_memberships mm
  join public.conversations c on c.id = mm.conversation_id
  join other_members om on om.conversation_id = c.id
  join public.public_profiles pp on pp.id = om.user_id
  left join lateral (
    select m.id, m.body, m.created_at, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc, m.id desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as total
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id <> viewer
      and m.created_at > coalesce(mm.last_read_at, '1970-01-01'::timestamptz)
  ) unread on true
  order by c.updated_at desc;
$$;

grant execute on function public.get_messages_inbox(uuid) to authenticated;
