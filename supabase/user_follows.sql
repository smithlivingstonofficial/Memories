create table public.user_follows (
  id uuid not null default gen_random_uuid (),
  follower_id uuid not null,
  following_id uuid not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_follows_pkey primary key (id),
  constraint user_follows_follower_id_following_id_key unique (follower_id, following_id),
  constraint user_follows_follower_id_fkey foreign KEY (follower_id) references auth.users (id) on delete CASCADE,
  constraint user_follows_following_id_fkey foreign KEY (following_id) references auth.users (id) on delete CASCADE,
  constraint user_follows_check check ((follower_id <> following_id)),
  constraint user_follows_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'blocked'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists user_follows_follower_idx on public.user_follows using btree (follower_id) TABLESPACE pg_default;

create index IF not exists user_follows_following_idx on public.user_follows using btree (following_id) TABLESPACE pg_default;

create index IF not exists user_follows_status_idx on public.user_follows using btree (status) TABLESPACE pg_default;

create trigger set_user_follows_updated_at BEFORE
update on user_follows for EACH row
execute FUNCTION set_updated_at ();