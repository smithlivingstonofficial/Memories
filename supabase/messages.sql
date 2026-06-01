create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  body text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete CASCADE,
  constraint messages_body_check check (
    (
      (char_length(body) >= 1)
      and (char_length(body) <= 2000)
    )
  )
) TABLESPACE pg_default;

create index IF not exists messages_conversation_created_idx on public.messages using btree (conversation_id, created_at desc) TABLESPACE pg_default;

create index IF not exists messages_sender_idx on public.messages using btree (sender_id) TABLESPACE pg_default;