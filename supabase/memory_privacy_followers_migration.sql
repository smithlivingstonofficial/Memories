alter table public.memories
  drop constraint if exists memories_privacy_check;

update public.memories
set privacy = 'followers'
where privacy = 'friends';

alter table public.memories
  add constraint memories_privacy_check check (
    privacy = any (
      array[
        'private'::text,
        'followers'::text,
        'inner_circle'::text,
        'public'::text,
        'vault'::text
      ]
    )
  );

notify pgrst, 'reload schema';
