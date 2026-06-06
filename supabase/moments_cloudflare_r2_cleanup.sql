-- Move Moments media metadata toward Cloudflare R2 object storage.
--
-- This does not move old Supabase Storage files automatically.
-- New uploads should store:
--   object_key: moments/{owner_id}/{yyyy-mm-dd}/{uuid}-{filename}
--   public_url: https://your-r2-public-domain/moments/...
--
-- Automatic deletion flow:
--   1. A scheduled job calls POST /api/cron/moments-cleanup with Authorization: Bearer CRON_SECRET.
--   2. The API deletes the Cloudflare R2 objects.
--   3. The API calls delete_claimed_moment_media(...) to remove metadata rows.

alter table public.moment_media
  add column if not exists storage_provider text not null default 'cloudflare_r2',
  add column if not exists expires_at timestamptz,
  add column if not exists cleanup_claimed_at timestamptz;

create index if not exists moment_media_expiry_idx
  on public.moment_media (expires_at)
  where expires_at is not null;

create index if not exists moment_media_cleanup_claim_idx
  on public.moment_media (cleanup_claimed_at)
  where cleanup_claimed_at is not null;

create or replace function public.claim_expired_moment_media(batch_size int default 100)
returns table (
  id uuid,
  object_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  has_moment_expires_at boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'moments'
      and column_name = 'expires_at'
  )
  into has_moment_expires_at;

  if has_moment_expires_at then
    return query execute $query$
      with expired as (
        select mm.id
        from public.moment_media mm
        join public.moments mo on mo.id = mm.moment_id
        where mm.storage_provider = 'cloudflare_r2'
          and mm.object_key is not null
          and mm.cleanup_claimed_at is null
          and coalesce(mm.expires_at, mo.expires_at) <= now()
        order by coalesce(mm.expires_at, mo.expires_at) asc
        limit $1
        for update skip locked
      )
      update public.moment_media mm
      set cleanup_claimed_at = now()
      from expired
      where mm.id = expired.id
      returning mm.id, mm.object_key
    $query$ using batch_size;
  else
    return query
      with expired as (
        select mm.id
        from public.moment_media mm
        where mm.storage_provider = 'cloudflare_r2'
          and mm.object_key is not null
          and mm.cleanup_claimed_at is null
          and mm.expires_at <= now()
        order by mm.expires_at asc
        limit batch_size
        for update skip locked
      )
      update public.moment_media mm
      set cleanup_claimed_at = now()
      from expired
      where mm.id = expired.id
      returning mm.id, mm.object_key;
  end if;
end;
$$;

create or replace function public.delete_claimed_moment_media(media_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.moment_media
  where id = any(media_ids)
    and cleanup_claimed_at is not null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.claim_expired_moment_media(int) from public;
revoke all on function public.delete_claimed_moment_media(uuid[]) from public;

notify pgrst, 'reload schema';
