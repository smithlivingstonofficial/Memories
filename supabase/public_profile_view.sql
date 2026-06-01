-- Run once on an existing database after unifying profiles.
-- This is a read-only public identity view, not a second profile table.
-- It exposes only safe profile fields and keeps private columns like
-- mobile_number and date_of_birth inside public.profiles.

drop view if exists public.public_profiles;

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
