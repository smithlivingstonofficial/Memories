alter table public.memories
  add column if not exists latitude double precision null,
  add column if not exists longitude double precision null,
  add column if not exists location_label text null,
  add column if not exists location_source text not null default 'unknown',
  add column if not exists location_confidence double precision null,
  add column if not exists location_accuracy_meters double precision null;

alter table public.memories
  drop constraint if exists memories_location_source_check,
  add constraint memories_location_source_check check (
    location_source = any (
      array[
        'manual'::text,
        'browser_gps'::text,
        'media_gps'::text,
        'mixed_media'::text,
        'unknown'::text
      ]
    )
  );

update public.memories
set location_label = location_name
where location_label is null
  and location_name is not null;

alter table public.media_assets
  add column if not exists latitude double precision null,
  add column if not exists longitude double precision null,
  add column if not exists location_source text not null default 'unknown',
  add column if not exists original_size_bytes bigint null,
  add column if not exists optimized_size_bytes bigint null,
  add column if not exists optimization_status text not null default 'not_needed',
  add column if not exists used_for_location_suggestion boolean not null default false;

alter table public.media_assets
  drop constraint if exists media_assets_location_source_check,
  add constraint media_assets_location_source_check check (
    location_source = any (
      array['media_gps'::text, 'unknown'::text]
    )
  );

alter table public.media_assets
  drop constraint if exists media_assets_optimization_status_check,
  add constraint media_assets_optimization_status_check check (
    optimization_status = any (
      array[
        'not_needed'::text,
        'optimized'::text,
        'skipped'::text,
        'failed'::text
      ]
    )
  );

create index if not exists memories_location_idx
  on public.memories using btree (owner_id, latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists media_assets_location_idx
  on public.media_assets using btree (owner_id, latitude, longitude)
  where latitude is not null and longitude is not null;

notify pgrst, 'reload schema';
