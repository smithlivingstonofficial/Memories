create table public.media_assets (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  bucket text not null,
  object_key text not null,
  public_url text null,
  file_name text null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  media_kind text not null,
  purpose text not null,
  visibility text not null default 'private'::text,
  upload_status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  constraint media_assets_pkey primary key (id),
  constraint media_assets_object_key_key unique (object_key),
  constraint media_assets_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint media_assets_media_kind_check check (
    (
      media_kind = any (
        array[
          'image'::text,
          'video'::text,
          'audio'::text,
          'document'::text
        ]
      )
    )
  ),
  constraint media_assets_purpose_check check (
    (
      purpose = any (
        array[
          'profile_avatar'::text,
          'profile_cover'::text,
          'memory'::text,
          'moment'::text,
          'vault'::text
        ]
      )
    )
  ),
  constraint media_assets_upload_status_check check (
    (
      upload_status = any (
        array['pending'::text, 'uploaded'::text, 'failed'::text]
      )
    )
  ),
  constraint media_assets_visibility_check check (
    (
      visibility = any (
        array[
          'private'::text,
          'inner_circle'::text,
          'public'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

alter table public.media_assets enable row level security;

drop policy if exists "Users can view their own media assets" on public.media_assets;
create policy "Users can view their own media assets"
  on public.media_assets
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Public media assets are viewable" on public.media_assets;
create policy "Public media assets are viewable"
  on public.media_assets
  for select
  using (visibility = 'public' and upload_status = 'uploaded');

drop policy if exists "Users can insert their own media assets" on public.media_assets;
create policy "Users can insert their own media assets"
  on public.media_assets
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own media assets" on public.media_assets;
create policy "Users can update their own media assets"
  on public.media_assets
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own media assets" on public.media_assets;
create policy "Users can delete their own media assets"
  on public.media_assets
  for delete
  using (auth.uid() = owner_id);
