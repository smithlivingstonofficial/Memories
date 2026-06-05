-- Recommended Supabase performance SQL for Memories.
-- Run in Supabase SQL Editor. Do not paste secrets.
-- Safe to run repeatedly.

create index if not exists memories_created_idx
  on public.memories (created_at desc);

create index if not exists media_assets_id_uploaded_idx
  on public.media_assets (id)
  where upload_status = 'uploaded';

create index if not exists conversation_members_conversation_user_idx
  on public.conversation_members (conversation_id, user_id);

create index if not exists conversation_members_user_conversation_read_idx
  on public.conversation_members (user_id, conversation_id, last_read_at);

create index if not exists messages_conversation_created_id_idx
  on public.messages (conversation_id, created_at desc, id desc);

create index if not exists moments_active_created_idx
  on public.moments (cleanup_status, is_archived, expires_at, created_at desc);

create index if not exists public_profiles_search_updated_idx
  on public.profiles (is_searchable, updated_at desc)
  where is_searchable = true;

-- Also run supabase/messages_inbox_performance.sql to install get_messages_inbox(viewer uuid).
