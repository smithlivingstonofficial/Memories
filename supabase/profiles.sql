create table public.profiles (
  id uuid not null,
  username text null,
  full_name text null,
  mobile_number text null,
  avatar_url text null,
  bio text null,
  cover_url text null,
  is_searchable boolean null default true,
  account_visibility text null default 'public'::text,
  profile_completed boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  password_set boolean null default false,
  signup_method text null default 'google'::text,
  mobile_country_code text null default '+91'::text,
  date_of_birth date null,
  avatar_asset_id uuid null,
  cover_asset_id uuid null,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_avatar_asset_id_fkey foreign KEY (avatar_asset_id) references media_assets (id) on delete set null,
  constraint profiles_cover_asset_id_fkey foreign KEY (cover_asset_id) references media_assets (id) on delete set null,
  constraint profiles_account_visibility_check check (
    (
      account_visibility = any (array['public'::text, 'private'::text])
    )
  ),
  constraint profiles_mobile_number_format check (
    (
      (mobile_number is null)
      or (mobile_number ~ '^[+0-9 ()-]{7,20}$'::text)
    )
  ),
  constraint profiles_mobile_number_format_check check (
    (
      (mobile_number is null)
      or (mobile_number ~ '^[0-9]{7,15}$'::text)
    )
  ),
  constraint profiles_username_format check (
    (
      (username is null)
      or (username ~ '^[a-z0-9_]{3,24}$'::text)
    )
  ),
  constraint profiles_username_format_check check (
    (
      (username is null)
      or (username ~ '^[a-z0-9_]{3,24}$'::text)
    )
  ),
  constraint profiles_date_of_birth_check check (
    (
      (date_of_birth is null)
      or (date_of_birth <= CURRENT_DATE)
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists profiles_username_lower_unique on public.profiles using btree (lower(username)) TABLESPACE pg_default
where
  (username is not null);

create index IF not exists profiles_username_idx on public.profiles using btree (username) TABLESPACE pg_default;

create index IF not exists profiles_account_visibility_idx on public.profiles using btree (account_visibility) TABLESPACE pg_default;

create index IF not exists profiles_is_searchable_idx on public.profiles using btree (is_searchable) TABLESPACE pg_default;

create index IF not exists profiles_avatar_asset_idx on public.profiles using btree (avatar_asset_id) TABLESPACE pg_default;

create index IF not exists profiles_cover_asset_idx on public.profiles using btree (cover_asset_id) TABLESPACE pg_default;

create index IF not exists profiles_search_idx on public.profiles using btree (is_searchable, account_visibility) TABLESPACE pg_default;

create unique INDEX IF not exists profiles_username_unique_idx on public.profiles using btree (lower(username)) TABLESPACE pg_default
where
  (username is not null);

create index IF not exists profiles_id_completed_idx on public.profiles using btree (id, profile_completed, password_set) TABLESPACE pg_default;

create trigger set_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
