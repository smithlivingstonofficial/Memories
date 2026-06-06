-- Repair Moment insert policies if creating a Moment fails with:
-- "new row violates row-level security policy for table \"moments\"".

alter table public.moments enable row level security;

drop policy if exists "Users can create their own moments" on public.moments;
create policy "Users can create their own moments"
  on public.moments
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

alter table public.moment_media enable row level security;

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

notify pgrst, 'reload schema';
