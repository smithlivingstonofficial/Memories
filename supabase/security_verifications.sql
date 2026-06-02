create table if not exists public.security_verifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  purpose text not null,
  token_hash text not null,
  expires_at timestamp with time zone not null,
  consumed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint security_verifications_pkey primary key (id),
  constraint security_verifications_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint security_verifications_token_hash_key unique (token_hash),
  constraint security_verifications_token_hash_check check (length(token_hash) >= 32),
  constraint security_verifications_purpose_check check (
    purpose = any (array['account_password'::text])
  )
);

create index if not exists security_verifications_user_idx
  on public.security_verifications using btree (user_id, purpose, expires_at desc);

create index if not exists security_verifications_token_idx
  on public.security_verifications using btree (token_hash, expires_at desc);

alter table public.security_verifications enable row level security;

drop policy if exists "Users can create their own security verifications" on public.security_verifications;
create policy "Users can create their own security verifications"
  on public.security_verifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read pending security verifications" on public.security_verifications;
create policy "Authenticated users can read pending security verifications"
  on public.security_verifications
  for select
  to authenticated
  using (consumed_at is null and expires_at > now());

drop policy if exists "Users can consume their own security verifications" on public.security_verifications;
create policy "Users can consume their own security verifications"
  on public.security_verifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own security verifications" on public.security_verifications;
create policy "Users can delete their own security verifications"
  on public.security_verifications
  for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
