-- Run once to move public profile data into profiles and remove the old table.
-- This keeps one profile row per user in public.profiles.

alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists is_searchable boolean default true,
  add column if not exists account_visibility text default 'public',
  add column if not exists cover_asset_id uuid;

alter table public.profiles
  add column if not exists mobile_country_code text default '+91',
  add column if not exists date_of_birth date,
  add column if not exists avatar_asset_id uuid;

alter table public.profiles
  drop constraint if exists profiles_account_visibility_check;

alter table public.profiles
  add constraint profiles_account_visibility_check
  check (account_visibility in ('public', 'private'));

alter table public.profiles
  drop constraint if exists profiles_date_of_birth_check;

alter table public.profiles
  add constraint profiles_date_of_birth_check
  check (date_of_birth is null or date_of_birth <= current_date);

alter table public.profiles
  drop constraint if exists profiles_mobile_number_format_check;

alter table public.profiles
  add constraint profiles_mobile_number_format_check
  check (mobile_number is null or mobile_number ~ '^[0-9]{7,15}$');

do $$
begin
  if to_regclass('public.public_profiles') is not null then
    update public.profiles p
    set
      username = coalesce(p.username, pp.username),
      full_name = coalesce(p.full_name, pp.full_name),
      bio = coalesce(p.bio, pp.bio),
      avatar_url = coalesce(p.avatar_url, pp.avatar_url),
      cover_url = coalesce(p.cover_url, pp.cover_url),
      avatar_asset_id = coalesce(p.avatar_asset_id, pp.avatar_asset_id),
      cover_asset_id = coalesce(p.cover_asset_id, pp.cover_asset_id),
      is_searchable = coalesce(pp.is_searchable, p.is_searchable, true),
      account_visibility = coalesce(pp.account_visibility, p.account_visibility, 'public'),
      updated_at = now()
    from public.public_profiles pp
    where p.id = pp.id;
  end if;
end $$;

create index if not exists profiles_account_visibility_idx
  on public.profiles using btree (account_visibility);

create index if not exists profiles_is_searchable_idx
  on public.profiles using btree (is_searchable);

create index if not exists profiles_avatar_asset_idx
  on public.profiles using btree (avatar_asset_id);

create index if not exists profiles_cover_asset_idx
  on public.profiles using btree (cover_asset_id);

create index if not exists profiles_search_idx
  on public.profiles using btree (is_searchable, account_visibility);

drop table if exists public.public_profiles;

create view public.public_profiles
with (security_invoker = false)
as
select
  id,
  username,
  full_name,
  bio,
  avatar_url,
  cover_url,
  avatar_asset_id,
  cover_asset_id,
  is_searchable,
  account_visibility,
  profile_completed,
  updated_at
from public.profiles
where profile_completed = true;

grant select on public.public_profiles to anon, authenticated;

notify pgrst, 'reload schema';
