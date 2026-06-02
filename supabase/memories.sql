create table public.memories (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  title text null,
  content text not null,
  mood text null,
  privacy text not null default 'private'::text,
  location_name text null,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  moods text[] not null default '{}'::text[],
  entry_date date not null default CURRENT_DATE,
  entry_timezone text not null default 'Asia/Kolkata'::text,
  media_count integer not null default 0,
  is_favorite boolean not null default false,
  latitude double precision null,
  longitude double precision null,
  location_label text null,
  location_source text not null default 'unknown'::text,
  location_confidence double precision null,
  location_accuracy_meters double precision null,
  constraint memories_pkey primary key (id),
  constraint memories_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint memories_media_count_nonnegative check ((media_count >= 0)),
  constraint memories_location_source_check check (
    (
      location_source = any (
        array[
          'manual'::text,
          'browser_gps'::text,
          'media_gps'::text,
          'mixed_media'::text,
          'unknown'::text
        ]
      )
    )
  ),
  constraint memories_privacy_check check (
    (
      privacy = any (
        array[
          'private'::text,
          'followers'::text,
          'inner_circle'::text,
          'public'::text,
          'vault'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists memories_owner_created_idx on public.memories using btree (owner_id, created_at desc) TABLESPACE pg_default;

create index IF not exists memories_privacy_created_idx on public.memories using btree (privacy, created_at desc) TABLESPACE pg_default;

create index IF not exists memories_moods_gin_idx on public.memories using gin (moods) TABLESPACE pg_default;

create index IF not exists memories_diary_calendar_idx on public.memories using btree (owner_id, entry_date desc, created_at desc) TABLESPACE pg_default;

create index IF not exists memories_diary_calendar_privacy_idx on public.memories using btree (owner_id, privacy, entry_date desc) TABLESPACE pg_default;

create index IF not exists memories_favorite_idx on public.memories using btree (owner_id, is_favorite) TABLESPACE pg_default
where
  (is_favorite = true);

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
