create table public.conversation_members (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone not null default now(),
  last_read_at timestamp with time zone null,
  constraint conversation_members_pkey primary key (id),
  constraint conversation_members_conversation_id_user_id_key unique (conversation_id, user_id),
  constraint conversation_members_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint conversation_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists conversation_members_conversation_idx on public.conversation_members using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists conversation_members_user_idx on public.conversation_members using btree (user_id) TABLESPACE pg_default;

create index IF not exists conversation_members_user_read_idx on public.conversation_members using btree (user_id, last_read_at) TABLESPACE pg_default;