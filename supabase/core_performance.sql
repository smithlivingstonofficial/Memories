-- Core performance helpers for Memories.
-- Safe to run repeatedly.

create index if not exists memories_owner_entry_created_idx
  on public.memories using btree (owner_id, entry_date desc, created_at desc);

create index if not exists memories_owner_privacy_created_idx
  on public.memories using btree (owner_id, privacy, created_at desc);

create index if not exists memory_media_memory_sort_idx
  on public.memory_media using btree (memory_id, sort_order);

create index if not exists memory_likes_memory_user_idx
  on public.memory_likes using btree (memory_id, user_id);

create index if not exists memory_reflections_memory_created_idx
  on public.memory_reflections using btree (memory_id, created_at);

create index if not exists user_follows_pair_status_idx
  on public.user_follows using btree (follower_id, following_id, status);

create index if not exists media_assets_owner_status_purpose_idx
  on public.media_assets using btree (owner_id, upload_status, purpose);

create or replace function public.get_profile_summary(target_user uuid)
returns table (
  memories_count bigint,
  vault_count bigint,
  media_count bigint,
  followers_count bigint,
  following_count bigint,
  pending_requests_count bigint,
  sent_requests_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select count(*)
      from public.memories
      where owner_id = target_user
        and privacy <> 'vault'
    ) as memories_count,
    (
      select count(*)
      from public.memories
      where owner_id = target_user
        and privacy = 'vault'
    ) as vault_count,
    (
      select count(*)
      from public.media_assets
      where owner_id = target_user
        and upload_status = 'uploaded'
    ) as media_count,
    (
      select count(*)
      from public.user_follows
      where following_id = target_user
        and status = 'accepted'
    ) as followers_count,
    (
      select count(*)
      from public.user_follows
      where follower_id = target_user
        and status = 'accepted'
    ) as following_count,
    (
      select count(*)
      from public.user_follows
      where following_id = target_user
        and status = 'pending'
    ) as pending_requests_count,
    (
      select count(*)
      from public.user_follows
      where follower_id = target_user
        and status = 'pending'
    ) as sent_requests_count;
$$;

create or replace function public.get_memory_engagement_summary(
  memory_ids uuid[],
  viewer uuid
)
returns table (
  memory_id uuid,
  like_count bigint,
  reflection_count bigint,
  viewer_has_liked boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with target_memories as (
    select distinct unnest(memory_ids) as id
  ),
  like_counts as (
    select memory_id, count(*) as total
    from public.memory_likes
    where memory_id = any(memory_ids)
    group by memory_id
  ),
  reflection_counts as (
    select memory_id, count(*) as total
    from public.memory_reflections
    where memory_id = any(memory_ids)
    group by memory_id
  ),
  viewer_likes as (
    select memory_id
    from public.memory_likes
    where memory_id = any(memory_ids)
      and user_id = viewer
  )
  select
    target_memories.id as memory_id,
    coalesce(like_counts.total, 0) as like_count,
    coalesce(reflection_counts.total, 0) as reflection_count,
    viewer_likes.memory_id is not null as viewer_has_liked
  from target_memories
  left join like_counts on like_counts.memory_id = target_memories.id
  left join reflection_counts on reflection_counts.memory_id = target_memories.id
  left join viewer_likes on viewer_likes.memory_id = target_memories.id;
$$;

grant execute on function public.get_profile_summary(uuid) to authenticated;
grant execute on function public.get_memory_engagement_summary(uuid[], uuid) to authenticated;
