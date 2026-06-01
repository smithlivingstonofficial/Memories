-- Run once on an existing database to allow authenticated users to upload
-- their own media and attach it to their own memories.

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

alter table public.memories enable row level security;

drop policy if exists "Users can view their own memories" on public.memories;
create policy "Users can view their own memories"
  on public.memories
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Public memories are viewable" on public.memories;
create policy "Public memories are viewable"
  on public.memories
  for select
  using (privacy = 'public');

drop policy if exists "Users can insert their own memories" on public.memories;
create policy "Users can insert their own memories"
  on public.memories
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own memories" on public.memories;
create policy "Users can update their own memories"
  on public.memories
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own memories" on public.memories;
create policy "Users can delete their own memories"
  on public.memories
  for delete
  using (auth.uid() = owner_id);

alter table public.memory_media enable row level security;

drop policy if exists "Users can view their own memory media" on public.memory_media;
create policy "Users can view their own memory media"
  on public.memory_media
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Public memory media is viewable" on public.memory_media;
create policy "Public memory media is viewable"
  on public.memory_media
  for select
  using (
    exists (
      select 1
      from public.memories
      where memories.id = memory_media.memory_id
        and memories.privacy = 'public'
    )
  );

drop policy if exists "Users can insert their own memory media" on public.memory_media;
create policy "Users can insert their own memory media"
  on public.memory_media
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own memory media" on public.memory_media;
create policy "Users can update their own memory media"
  on public.memory_media
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own memory media" on public.memory_media;
create policy "Users can delete their own memory media"
  on public.memory_media
  for delete
  using (auth.uid() = owner_id);

notify pgrst, 'reload schema';
