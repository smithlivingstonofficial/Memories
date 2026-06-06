-- Repair after accidentally running the old moments_creator_foundation.sql.
--
-- Safe intent:
-- - Keep real Memories data.
-- - Keep auth.users untouched.
-- - Restore the intended Moments visibility/update/delete RLS policies.
-- - Remove only mismatched compatibility columns that the app does not use.
--
-- Note: storage_provider, expires_at, and cleanup_claimed_at on moment_media are
-- harmless and may be used by the optional Cloudflare cleanup helper, so this
-- script leaves them in place.

alter table public.moments enable row level security;
alter table public.moment_media enable row level security;

-- Restore intended Moment policies.
drop policy if exists "Users can view visible moments" on public.moments;
create policy "Users can view visible moments"
  on public.moments
  for select
  to authenticated
  using (public.can_view_moment(id, auth.uid()));

drop policy if exists "Users can read their own moments" on public.moments;

drop policy if exists "Users can create their own moments" on public.moments;
create policy "Users can create their own moments"
  on public.moments
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own moments" on public.moments;
create policy "Users can update their own moments"
  on public.moments
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own moments" on public.moments;
create policy "Users can delete their own moments"
  on public.moments
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Restore intended Moment media policies.
drop policy if exists "Users can view media for visible moments" on public.moment_media;
create policy "Users can view media for visible moments"
  on public.moment_media
  for select
  to authenticated
  using (public.can_view_moment(moment_id, auth.uid()));

drop policy if exists "Users can read media for their own moments" on public.moment_media;

drop policy if exists "Users can create media for their own moments" on public.moment_media;
create policy "Users can create media for their own moments"
  on public.moment_media
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.moments mo
      where mo.id = moment_media.moment_id
        and mo.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own moment media" on public.moment_media;
create policy "Users can update their own moment media"
  on public.moment_media
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own moment media" on public.moment_media;
create policy "Users can delete their own moment media"
  on public.moment_media
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Remove confusing columns from the old foundation script.
drop index if exists public.moment_media_moment_sort_idx;

alter table public.moments
  drop column if exists title,
  drop column if exists status;

alter table public.moment_media
  drop column if exists media_type,
  drop column if exists sort_order;

notify pgrst, 'reload schema';
