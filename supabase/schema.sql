-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversation_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_at timestamp with time zone,
  CONSTRAINT conversation_members_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_type text NOT NULL DEFAULT 'direct'::text CHECK (conversation_type = 'direct'::text),
  direct_key text UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.inner_circle_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'accepted'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inner_circle_members_pkey PRIMARY KEY (id),
  CONSTRAINT inner_circle_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT inner_circle_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id)
);
CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  bucket text NOT NULL,
  object_key text NOT NULL UNIQUE,
  public_url text,
  file_name text,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  media_kind text NOT NULL CHECK (media_kind = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text])),
  purpose text NOT NULL CHECK (purpose = ANY (ARRAY['profile_avatar'::text, 'profile_cover'::text, 'memory'::text, 'moment'::text, 'vault'::text])),
  visibility text NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['private'::text, 'inner_circle'::text, 'public'::text])),
  upload_status text NOT NULL DEFAULT 'pending'::text CHECK (upload_status = ANY (ARRAY['pending'::text, 'uploaded'::text, 'failed'::text])),
  latitude double precision,
  longitude double precision,
  location_source text NOT NULL DEFAULT 'unknown'::text CHECK (location_source = ANY (ARRAY['media_gps'::text, 'unknown'::text])),
  original_size_bytes bigint,
  optimized_size_bytes bigint,
  optimization_status text NOT NULL DEFAULT 'not_needed'::text CHECK (optimization_status = ANY (ARRAY['not_needed'::text, 'optimized'::text, 'skipped'::text, 'failed'::text])),
  used_for_location_suggestion boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_pkey PRIMARY KEY (id),
  CONSTRAINT media_assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  mood text,
  privacy text NOT NULL DEFAULT 'private'::text CHECK (privacy = ANY (ARRAY['private'::text, 'followers'::text, 'inner_circle'::text, 'public'::text, 'vault'::text])),
  location_name text,
  latitude double precision,
  longitude double precision,
  location_label text,
  location_source text NOT NULL DEFAULT 'unknown'::text CHECK (location_source = ANY (ARRAY['manual'::text, 'browser_gps'::text, 'media_gps'::text, 'mixed_media'::text, 'unknown'::text])),
  location_confidence double precision CHECK (location_confidence IS NULL OR location_confidence >= 0::double precision AND location_confidence <= 1::double precision),
  location_accuracy_meters double precision CHECK (location_accuracy_meters IS NULL OR location_accuracy_meters >= 0::double precision),
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  moods ARRAY NOT NULL DEFAULT '{}'::text[],
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_timezone text NOT NULL DEFAULT 'Asia/Kolkata'::text,
  media_count integer NOT NULL DEFAULT 0 CHECK (media_count >= 0),
  is_favorite boolean NOT NULL DEFAULT false,
  CONSTRAINT memories_pkey PRIMARY KEY (id),
  CONSTRAINT memories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.memory_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT memory_likes_pkey PRIMARY KEY (id),
  CONSTRAINT memory_likes_memory_id_fkey FOREIGN KEY (memory_id) REFERENCES public.memories(id),
  CONSTRAINT memory_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.memory_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_pkey PRIMARY KEY (id),
  CONSTRAINT memory_media_memory_id_fkey FOREIGN KEY (memory_id) REFERENCES public.memories(id),
  CONSTRAINT memory_media_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.media_assets(id),
  CONSTRAINT memory_media_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.memory_reflections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT memory_reflections_pkey PRIMARY KEY (id),
  CONSTRAINT memory_reflections_memory_id_fkey FOREIGN KEY (memory_id) REFERENCES public.memories(id),
  CONSTRAINT memory_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.moment_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  object_key text NOT NULL,
  public_url text,
  media_kind text NOT NULL CHECK (media_kind = ANY (ARRAY['image'::text, 'video'::text])),
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  latitude double precision,
  longitude double precision,
  location_source text NOT NULL DEFAULT 'unknown'::text CHECK (location_source = ANY (ARRAY['media_gps'::text, 'unknown'::text])),
  original_size_bytes bigint,
  optimized_size_bytes bigint,
  optimization_status text NOT NULL DEFAULT 'not_needed'::text CHECK (optimization_status = ANY (ARRAY['not_needed'::text, 'optimized'::text, 'skipped'::text, 'failed'::text])),
  used_for_location_suggestion boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  upload_status text NOT NULL DEFAULT 'uploaded'::text CHECK (upload_status = ANY (ARRAY['pending'::text, 'uploaded'::text, 'failed'::text, 'deleted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moment_media_pkey PRIMARY KEY (id),
  CONSTRAINT moment_media_moment_id_fkey FOREIGN KEY (moment_id) REFERENCES public.moments(id),
  CONSTRAINT moment_media_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.moment_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moment_views_pkey PRIMARY KEY (id),
  CONSTRAINT moment_views_moment_id_fkey FOREIGN KEY (moment_id) REFERENCES public.moments(id),
  CONSTRAINT moment_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.moments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  caption text CHECK (caption IS NULL OR char_length(caption) <= 280),
  mood text,
  location_name text,
  latitude double precision,
  longitude double precision,
  location_label text,
  location_source text NOT NULL DEFAULT 'unknown'::text CHECK (location_source = ANY (ARRAY['manual'::text, 'browser_gps'::text, 'media_gps'::text, 'mixed_media'::text, 'unknown'::text])),
  location_confidence double precision CHECK (location_confidence IS NULL OR location_confidence >= 0::double precision AND location_confidence <= 1::double precision),
  location_accuracy_meters double precision CHECK (location_accuracy_meters IS NULL OR location_accuracy_meters >= 0::double precision),
  visibility text NOT NULL DEFAULT 'followers'::text CHECK (visibility = ANY (ARRAY['public'::text, 'followers'::text, 'inner_circle'::text, 'private'::text])),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '24:00:00'::interval),
  is_archived boolean NOT NULL DEFAULT false,
  cleanup_status text NOT NULL DEFAULT 'active'::text CHECK (cleanup_status = ANY (ARRAY['active'::text, 'queued'::text, 'deleted'::text, 'failed'::text])),
  cleanup_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moments_pkey PRIMARY KEY (id),
  CONSTRAINT moments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,24}$'::text),
  full_name text,
  mobile_number text CHECK (mobile_number IS NULL OR mobile_number ~ '^[+0-9 ()-]{7,20}$'::text),
  avatar_url text,
  bio text,
  cover_url text,
  is_searchable boolean DEFAULT true,
  account_visibility text DEFAULT 'public'::text CHECK (account_visibility = ANY (ARRAY['public'::text, 'private'::text])),
  profile_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_set boolean DEFAULT false,
  signup_method text DEFAULT 'google'::text,
  mobile_country_code text DEFAULT '+91'::text,
  date_of_birth date CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
  avatar_asset_id uuid,
  cover_asset_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_avatar_asset_id_fkey FOREIGN KEY (avatar_asset_id) REFERENCES public.media_assets(id),
  CONSTRAINT profiles_cover_asset_id_fkey FOREIGN KEY (cover_asset_id) REFERENCES public.media_assets(id)
);
CREATE TABLE public.security_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose = ANY (ARRAY['account_password'::text])),
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) >= 32),
  expires_at timestamp with time zone NOT NULL,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT security_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vault_passcodes (
  user_id uuid NOT NULL,
  pin_salt text NOT NULL CHECK (length(pin_salt) >= 16),
  pin_hash text NOT NULL CHECK (length(pin_hash) >= 32),
  hash_iterations integer NOT NULL DEFAULT 120000 CHECK (hash_iterations >= 100000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vault_passcodes_pkey PRIMARY KEY (user_id),
  CONSTRAINT vault_passcodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vault_unlock_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) >= 32),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT vault_unlock_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT vault_unlock_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);
