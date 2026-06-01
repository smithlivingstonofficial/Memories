create table public.inner_circle_members (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  member_id uuid not null,
  status text not null default 'accepted'::text,
  created_at timestamp with time zone not null default now(),
  constraint inner_circle_members_pkey primary key (id),
  constraint inner_circle_members_owner_id_member_id_key unique (owner_id, member_id),
  constraint inner_circle_members_member_id_fkey foreign KEY (member_id) references auth.users (id) on delete CASCADE,
  constraint inner_circle_members_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint inner_circle_members_status_check check (
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

create index IF not exists inner_circle_owner_idx on public.inner_circle_members using btree (owner_id) TABLESPACE pg_default;

create index IF not exists inner_circle_member_idx on public.inner_circle_members using btree (member_id) TABLESPACE pg_default;