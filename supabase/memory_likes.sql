create table public.memory_likes (
  id uuid not null default gen_random_uuid (),
  memory_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint memory_likes_pkey primary key (id),
  constraint memory_likes_memory_id_user_id_key unique (memory_id, user_id),
  constraint memory_likes_memory_id_fkey foreign KEY (memory_id) references memories (id) on delete CASCADE,
  constraint memory_likes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists memory_likes_memory_idx on public.memory_likes using btree (memory_id) TABLESPACE pg_default;

create index IF not exists memory_likes_user_idx on public.memory_likes using btree (user_id) TABLESPACE pg_default;