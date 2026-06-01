create table public.moments (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  caption text null,
  mood text null,
  location_name text null,
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

create index IF not exists moments_active_feed_idx on public.moments using btree (owner_id, expires_at, visibility) TABLESPACE pg_default
where
  (is_archived = false);

create index IF not exists moments_cleanup_expired_idx on public.moments using btree (cleanup_status, expires_at) TABLESPACE pg_default
where
  (is_archived = false);

create trigger set_moments_updated_at BEFORE
update on moments for EACH row
execute FUNCTION set_updated_at ();