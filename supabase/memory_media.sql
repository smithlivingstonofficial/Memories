create table public.memory_media (
  id uuid not null default gen_random_uuid (),
  memory_id uuid not null,
  asset_id uuid not null,
  owner_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint memory_media_pkey primary key (id),
  constraint memory_media_memory_id_asset_id_key unique (memory_id, asset_id),
  constraint memory_media_asset_id_fkey foreign KEY (asset_id) references media_assets (id) on delete CASCADE,
  constraint memory_media_memory_id_fkey foreign KEY (memory_id) references memories (id) on delete CASCADE,
  constraint memory_media_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists memory_media_memory_sort_idx on public.memory_media using btree (memory_id, sort_order) TABLESPACE pg_default;

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
