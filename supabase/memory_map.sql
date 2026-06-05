-- Memory Map schema additions.
-- Run this in the Supabase SQL Editor. Do not run from the app.

alter table public.memories
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_visibility text not null default 'private';

alter table public.memories
  add column if not exists location_name text;

alter table public.memories
  add column if not exists location_source text not null default 'unknown';

-- Normalize older saved coordinates into the Memory Map columns.
-- This keeps owner-only private and vault memory locations visible on /map.
update public.memories
set
  location_lat = coalesce(location_lat, latitude),
  location_lng = coalesce(location_lng, longitude),
  location_visibility = coalesce(location_visibility, 'private')
where (location_lat is null or location_lng is null)
  and latitude is not null
  and longitude is not null;

create index if not exists memories_owner_created_location_idx
  on public.memories (owner_id, created_at desc)
  where location_lat is not null
    and location_lng is not null;
