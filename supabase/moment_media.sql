create table public.moment_media (
  id uuid not null default gen_random_uuid (),
  moment_id uuid not null,
  owner_id uuid not null,
  object_key text not null,
  public_url text null,
  media_kind text not null,
  mime_type text null,
  size_bytes bigint null,
  width integer null,
  height integer null,
  duration_seconds numeric null,
  latitude double precision null,
  longitude double precision null,
  location_source text not null default 'unknown'::text,
  original_size_bytes bigint null,
  optimized_size_bytes bigint null,
  optimization_status text not null default 'not_needed'::text,
  used_for_location_suggestion boolean not null default false,
  display_order integer not null default 0,
  upload_status text not null default 'uploaded'::text,
  created_at timestamp with time zone not null default now(),
  constraint moment_media_pkey primary key (id),
  constraint moment_media_moment_id_fkey foreign KEY (moment_id) references moments (id) on delete CASCADE,
  constraint moment_media_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint moment_media_media_kind_check check (
    (
      media_kind = any (array['image'::text, 'video'::text])
    )
  ),
  constraint moment_media_location_source_check check (
    (
      location_source = any (array['media_gps'::text, 'unknown'::text])
    )
  ),
  constraint moment_media_optimization_status_check check (
    (
      optimization_status = any (
        array[
          'not_needed'::text,
          'optimized'::text,
          'skipped'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint moment_media_upload_status_check check (
    (
      upload_status = any (
        array[
          'pending'::text,
          'uploaded'::text,
          'failed'::text,
          'deleted'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists moment_media_moment_idx on public.moment_media using btree (moment_id) TABLESPACE pg_default;

create index IF not exists moment_media_owner_idx on public.moment_media using btree (owner_id) TABLESPACE pg_default;

create index IF not exists moment_media_object_key_idx on public.moment_media using btree (object_key) TABLESPACE pg_default;

create index IF not exists moment_media_cleanup_idx on public.moment_media using btree (moment_id, upload_status) TABLESPACE pg_default;

create index IF not exists moment_media_location_idx on public.moment_media using btree (owner_id, latitude, longitude) TABLESPACE pg_default
where
  ((latitude is not null) and (longitude is not null));
