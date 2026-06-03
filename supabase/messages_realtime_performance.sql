-- Message realtime and performance helpers for Memories.
-- Safe to run repeatedly.

create index if not exists messages_conversation_sender_created_idx
  on public.messages using btree (conversation_id, sender_id, created_at desc);

create index if not exists conversation_members_user_conversation_idx
  on public.conversation_members using btree (user_id, conversation_id);

create index if not exists conversations_updated_idx
  on public.conversations using btree (updated_at desc);

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists touch_conversation_on_message_insert on public.messages;
create trigger touch_conversation_on_message_insert
after insert on public.messages
for each row
execute function public.touch_conversation_on_message();

alter table realtime.messages enable row level security;

drop policy if exists "Users can receive Memories message broadcasts" on realtime.messages;
create policy "Users can receive Memories message broadcasts"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (
      (select realtime.topic()) = ('user-messages:' || (select auth.uid())::text)
      or (
        (select realtime.topic()) like 'conversation:%'
        and exists (
          select 1
          from public.conversation_members cm
          where cm.user_id = (select auth.uid())
            and cm.conversation_id::text = replace((select realtime.topic()), 'conversation:', '')
        )
      )
    )
  );

create or replace function public.broadcast_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_row record;
  message_payload jsonb;
begin
  message_payload := jsonb_build_object(
    'id', new.id,
    'conversationId', new.conversation_id,
    'senderId', new.sender_id,
    'body', new.body,
    'createdAt', new.created_at
  );

  perform realtime.send(
    message_payload,
    'message.created',
    'conversation:' || new.conversation_id::text,
    true
  );

  for member_row in
    select cm.user_id
    from public.conversation_members cm
    where cm.conversation_id = new.conversation_id
  loop
    perform realtime.send(
      message_payload,
      'message.created',
      'user-messages:' || member_row.user_id::text,
      true
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists broadcast_message_created_insert on public.messages;
create trigger broadcast_message_created_insert
after insert on public.messages
for each row
execute function public.broadcast_message_created();

create or replace function public.broadcast_message_read_receipt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_read_at is null or new.last_read_at is not distinct from old.last_read_at then
    return new;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'conversationId', new.conversation_id,
      'userId', new.user_id,
      'lastReadAt', new.last_read_at
    ),
    'message.read',
    'conversation:' || new.conversation_id::text,
    true
  );

  return new;
end;
$$;

drop trigger if exists broadcast_message_read_receipt_update on public.conversation_members;
create trigger broadcast_message_read_receipt_update
after update of last_read_at on public.conversation_members
for each row
execute function public.broadcast_message_read_receipt();

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime drop table public.messages;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime drop table public.conversation_members;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime drop table public.conversations;
  end if;
end $$;
