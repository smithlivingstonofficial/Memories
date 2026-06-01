create view public.diary_entries
with
  (security_invoker = true) as
select
  id as entry_id,
  owner_id,
  case
    when COALESCE(privacy, 'private'::text) = 'vault'::text then 'vault'::text
    else 'memory'::text
  end as entry_type,
  entry_date,
  COALESCE(title, 'Untitled memory'::text) as title,
  COALESCE(content, ''::text) as content,
  COALESCE(moods, '{}'::text[]) as moods,
  COALESCE(tags, '{}'::text[]) as tags,
  COALESCE(privacy, 'private'::text) as privacy,
  COALESCE(media_count, 0) as media_count,
  COALESCE(is_favorite, false) as is_favorite,
  created_at,
  updated_at
from
  memories m
where
  owner_id = auth.uid ();