create table public.moments (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  caption text null,
  mood text null,
  location_name text null,
  latitude double precision null,
  longitude double precision null,
  location_label text null,
  location_source text not null default 'unknown'::text,
  location_confidence double precision null,
  location_accuracy_meters double precision null,
  visibility text not null default 'followers'::text,
  expires_at timestamp with time zone not null default (now() + '24:00:00'::interval),
  is_archived boolean not null default false,
  cleanup_status text not null default 'active'::text,
  cleanup_error text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint moments_pkey primary key (id),
  constraint moments_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint moments_caption_check check (
    (
      (caption is null)
      or (char_length(caption) <= 280)
    )
  ),
  constraint moments_cleanup_status_check check (
    (
      cleanup_status = any (
        array[
          'active'::text,
          'queued'::text,
          'deleted'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint moments_location_confidence_check check (
    (
      (location_confidence is null)
      or (
        (location_confidence >= (0)::double precision)
        and (location_confidence <= (1)::double precision)
      )
    )
  ),
  constraint moments_location_accuracy_meters_check check (
    (
      (location_accuracy_meters is null)
      or (location_accuracy_meters >= (0)::double precision)
    )
  ),
  constraint moments_location_source_check check (
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
  constraint moments_visibility_check check (
    (
      visibility = any (
        array[
          'public'::text,
          'followers'::text,
          'inner_circle'::text,
          'private'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists moments_owner_idx on public.moments using btree (owner_id) TABLESPACE pg_default;

create index IF not exists moments_expires_idx on public.moments using btree (expires_at) TABLESPACE pg_default;

create index IF not exists moments_visibility_idx on public.moments using btree (visibility) TABLESPACE pg_default;

create index IF not exists moments_location_idx on public.moments using btree (owner_id, latitude, longitude) TABLESPACE pg_default
where
  ((latitude is not null) and (longitude is not null));

create index IF not exists moments_active_feed_idx on public.moments using btree (owner_id, expires_at, visibility) TABLESPACE pg_default
where
  (is_archived = false);

create index IF not exists moments_cleanup_expired_idx on public.moments using btree (cleanup_status, expires_at) TABLESPACE pg_default
where
  (is_archived = false);

create trigger set_moments_updated_at BEFORE
update on moments for EACH row
execute FUNCTION set_updated_at ();
