create table public.memory_reflections (
  id uuid not null default gen_random_uuid (),
  memory_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint memory_reflections_pkey primary key (id),
  constraint memory_reflections_memory_id_fkey foreign KEY (memory_id) references memories (id) on delete CASCADE,
  constraint memory_reflections_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint memory_reflections_content_check check (
    (
      (char_length(content) >= 1)
      and (char_length(content) <= 500)
    )
  )
) TABLESPACE pg_default;

create index IF not exists memory_reflections_memory_idx on public.memory_reflections using btree (memory_id) TABLESPACE pg_default;

create index IF not exists memory_reflections_user_idx on public.memory_reflections using btree (user_id) TABLESPACE pg_default;