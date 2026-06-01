create table public.conversations (
  id uuid not null default gen_random_uuid (),
  conversation_type text not null default 'direct'::text,
  direct_key text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_direct_key_key unique (direct_key),
  constraint conversations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete CASCADE,
  constraint conversations_conversation_type_check check ((conversation_type = 'direct'::text))
) TABLESPACE pg_default;

create index IF not exists conversations_created_by_idx on public.conversations using btree (created_by) TABLESPACE pg_default;