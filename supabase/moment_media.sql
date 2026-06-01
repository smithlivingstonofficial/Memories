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