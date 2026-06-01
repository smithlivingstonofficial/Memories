create table public.moment_views (
  id uuid not null default gen_random_uuid (),
  moment_id uuid not null,
  viewer_id uuid not null,
  viewed_at timestamp with time zone not null default now(),
  constraint moment_views_pkey primary key (id),
  constraint moment_views_moment_id_viewer_id_key unique (moment_id, viewer_id),
  constraint moment_views_moment_id_fkey foreign KEY (moment_id) references moments (id) on delete CASCADE,
  constraint moment_views_viewer_id_fkey foreign KEY (viewer_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists moment_views_moment_idx on public.moment_views using btree (moment_id) TABLESPACE pg_default;

create index IF not exists moment_views_viewer_idx on public.moment_views using btree (viewer_id) TABLESPACE pg_default;