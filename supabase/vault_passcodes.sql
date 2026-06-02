create table if not exists public.vault_passcodes (
  user_id uuid not null,
  pin_salt text not null,
  pin_hash text not null,
  hash_iterations integer not null default 120000,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vault_passcodes_pkey primary key (user_id),
  constraint vault_passcodes_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint vault_passcodes_pin_salt_check check (length(pin_salt) >= 16),
  constraint vault_passcodes_pin_hash_check check (length(pin_hash) >= 32),
  constraint vault_passcodes_iterations_check check (hash_iterations >= 100000)
) tablespace pg_default;

create trigger set_vault_passcodes_updated_at before
update on vault_passcodes for each row
execute function set_updated_at ();

alter table public.vault_passcodes enable row level security;

drop policy if exists "Users can view their own Vault passcode metadata" on public.vault_passcodes;
create policy "Users can view their own Vault passcode metadata"
  on public.vault_passcodes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can set their own Vault passcode" on public.vault_passcodes;
create policy "Users can set their own Vault passcode"
  on public.vault_passcodes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Vault passcode" on public.vault_passcodes;
create policy "Users can update their own Vault passcode"
  on public.vault_passcodes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.vault_unlock_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  token_hash text not null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  constraint vault_unlock_sessions_pkey primary key (id),
  constraint vault_unlock_sessions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint vault_unlock_sessions_token_hash_key unique (token_hash),
  constraint vault_unlock_sessions_token_hash_check check (length(token_hash) >= 32)
) tablespace pg_default;

create index if not exists vault_unlock_sessions_user_idx
  on public.vault_unlock_sessions using btree (user_id, expires_at desc) tablespace pg_default;

alter table public.vault_unlock_sessions enable row level security;

drop policy if exists "Users can view their own Vault unlock sessions" on public.vault_unlock_sessions;
create policy "Users can view their own Vault unlock sessions"
  on public.vault_unlock_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own Vault unlock sessions" on public.vault_unlock_sessions;
create policy "Users can create their own Vault unlock sessions"
  on public.vault_unlock_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Vault unlock sessions" on public.vault_unlock_sessions;
create policy "Users can delete their own Vault unlock sessions"
  on public.vault_unlock_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
