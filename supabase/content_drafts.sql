-- Durable content drafts for Memories.
-- Safe to run repeatedly.

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft_type text not null check (draft_type = any (array['memory', 'vault', 'moment'])),
  status text not null default 'active' check (status = any (array['active', 'published', 'discarded'])),
  title text,
  content text,
  caption text,
  moods text[] not null default '{}'::text[],
  privacy text,
  visibility text,
  entry_date date,
  entry_timezone text not null default 'Asia/Kolkata',
  location_name text,
  location_label text,
  latitude double precision,
  longitude double precision,
  location_source text not null default 'unknown',
  location_confidence double precision,
  location_accuracy_meters double precision,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  published_content_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_draft_media (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.content_drafts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  object_key text,
  public_url text,
  file_name text,
  mime_type text,
  media_kind text check (media_kind is null or media_kind = any (array['image', 'video', 'audio', 'document'])),
  size_bytes bigint,
  sort_order integer not null default 0,
  upload_status text not null default 'uploaded' check (upload_status = any (array['pending', 'uploaded', 'deleted', 'failed'])),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_drafts_owner_status_updated_idx
  on public.content_drafts using btree (owner_id, status, updated_at desc);

create index if not exists content_drafts_owner_type_updated_idx
  on public.content_drafts using btree (owner_id, draft_type, updated_at desc);

create index if not exists content_draft_media_draft_sort_idx
  on public.content_draft_media using btree (draft_id, sort_order);

create or replace function public.touch_content_draft_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_content_drafts_updated_at on public.content_drafts;
create trigger touch_content_drafts_updated_at
before update on public.content_drafts
for each row
execute function public.touch_content_draft_updated_at();

drop trigger if exists touch_content_draft_media_updated_at on public.content_draft_media;
create trigger touch_content_draft_media_updated_at
before update on public.content_draft_media
for each row
execute function public.touch_content_draft_updated_at();

alter table public.content_drafts enable row level security;
alter table public.content_draft_media enable row level security;

drop policy if exists "Users can view their own content drafts" on public.content_drafts;
create policy "Users can view their own content drafts"
  on public.content_drafts
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can create their own content drafts" on public.content_drafts;
create policy "Users can create their own content drafts"
  on public.content_drafts
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update their own content drafts" on public.content_drafts;
create policy "Users can update their own content drafts"
  on public.content_drafts
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete their own content drafts" on public.content_drafts;
create policy "Users can delete their own content drafts"
  on public.content_drafts
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can view their own content draft media" on public.content_draft_media;
create policy "Users can view their own content draft media"
  on public.content_draft_media
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can create their own content draft media" on public.content_draft_media;
create policy "Users can create their own content draft media"
  on public.content_draft_media
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update their own content draft media" on public.content_draft_media;
create policy "Users can update their own content draft media"
  on public.content_draft_media
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete their own content draft media" on public.content_draft_media;
create policy "Users can delete their own content draft media"
  on public.content_draft_media
  for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.discard_stale_content_drafts(retention interval default interval '30 days')
returns table (discarded_drafts bigint, deleted_media bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_ids uuid[];
begin
  select coalesce(array_agg(id), '{}'::uuid[])
  into draft_ids
  from public.content_drafts
  where status = 'active'
    and updated_at < now() - retention;

  update public.content_drafts
  set status = 'discarded'
  where id = any(draft_ids);

  update public.content_draft_media
  set upload_status = 'deleted'
  where draft_id = any(draft_ids)
    and upload_status <> 'deleted';

  return query
  select
    coalesce(array_length(draft_ids, 1), 0)::bigint,
    (
      select count(*)
      from public.content_draft_media
      where draft_id = any(draft_ids)
    )::bigint;
end;
$$;

grant execute on function public.discard_stale_content_drafts(interval) to authenticated;
