// src/lib/messages/get-messages-data.ts

import "server-only";

import { notFound } from "next/navigation";
import { withQueryTimer, withTimer } from "@/lib/debug/performance-timer";
import { resolveAssetUrlMap } from "@/lib/media/resolve-asset-urls";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type ConversationRow = {
  id: string;
  updated_at: string;
  created_at: string;
};

type MemberRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  avatar_asset_id: string | null;
  account_visibility?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type InboxRpcRow = {
  conversation_id: string;
  conversation_updated_at: string;
  other_user_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  last_message_id: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export type ConversationListItem = {
  id: string;
  updatedAt: string;
  unreadCount: number;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    body: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
};

export type MessagesInboxData = {
  conversations: ConversationListItem[];
};

export type MessageThreadItem = {
  id: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
  readStatus: "sent" | "seen" | null;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export type MessageThreadData = {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  messages: MessageThreadItem[];
};

function getDirectKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

async function canStartConversation({
  supabase,
  viewerId,
  targetUserId,
}: {
  supabase: SupabaseClient;
  viewerId: string;
  targetUserId: string;
}) {
  const { data: targetProfile } = await withQueryTimer(
    "message-thread:participants",
    supabase
      .from("public_profiles")
      .select("id, account_visibility")
      .eq("id", targetUserId)
      .maybeSingle()
  );

  if (!targetProfile) return false;

  if (targetProfile.account_visibility === "public") {
    return true;
  }

  const { data: acceptedConnection } = await withQueryTimer(
    "message-thread:participants",
    supabase
      .from("user_follows")
      .select("id")
      .or(
        `and(follower_id.eq.${viewerId},following_id.eq.${targetUserId},status.eq.accepted),and(follower_id.eq.${targetUserId},following_id.eq.${viewerId},status.eq.accepted)`
      )
      .maybeSingle()
  );

  return Boolean(acceptedConnection);
}

async function mapProfiles({
  supabase,
  userIds,
}: {
  supabase: SupabaseClient;
  userIds: string[];
}) {
  const uniqueIds = Array.from(new Set(userIds));

  if (uniqueIds.length === 0) {
    return new Map<string, ConversationListItem["otherUser"]>();
  }

  const { data: profiles } = await withQueryTimer(
    "messages-inbox:profiles",
    supabase
      .from("public_profiles")
      .select("id, username, full_name, avatar_url, avatar_asset_id")
      .in("id", uniqueIds)
  );

  const profileMap = new Map<string, ConversationListItem["otherUser"]>();
  const profileRows = (profiles ?? []) as ProfileRow[];
  const avatarUrlMap = await withTimer("messages-inbox:avatar-resolution", () =>
    resolveAssetUrlMap(
      supabase,
      profileRows.map((profile) => ({
        key: profile.id,
        assetId: profile.avatar_asset_id,
        fallbackUrl: profile.avatar_url,
      }))
    )
  );

  for (const profile of profileRows) {
    profileMap.set(profile.id, {
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: avatarUrlMap.get(profile.id) ?? null,
    });
  }

  return profileMap;
}

async function getOrCreateDirectConversation({
  supabase,
  userId,
  targetUserId,
}: {
  supabase: SupabaseClient;
  userId: string;
  targetUserId: string;
}) {
  const directKey = getDirectKey(userId, targetUserId);

  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("direct_key", directKey)
    .maybeSingle();

  if (existingConversation?.id) {
    return existingConversation.id as string;
  }

  const allowed = await canStartConversation({
    supabase,
    viewerId: userId,
    targetUserId,
  });

  if (!allowed) {
    notFound();
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      conversation_type: "direct",
      direct_key: directKey,
      created_by: userId,
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    throw new Error(
      conversationError?.message || "Unable to create conversation."
    );
  }

  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert([
      {
        conversation_id: conversation.id,
        user_id: userId,
      },
      {
        conversation_id: conversation.id,
        user_id: targetUserId,
      },
    ]);

  if (membersError) {
    throw new Error(membersError.message);
  }

  return conversation.id as string;
}

export async function getMessagesInboxData({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<MessagesInboxData> {
  return withTimer("messages-inbox:total", async () => {
    const { data: inboxRows, error: inboxError } = await withQueryTimer(
      "messages-inbox:conversations",
      supabase.rpc("get_messages_inbox", { viewer: userId })
    );

    if (!inboxError && inboxRows) {
      return {
        conversations: ((inboxRows ?? []) as InboxRpcRow[]).map((row) => ({
          id: row.conversation_id,
          updatedAt: row.conversation_updated_at,
          unreadCount: Number(row.unread_count ?? 0),
          otherUser: {
            id: row.other_user_id,
            username: row.other_username,
            fullName: row.other_full_name,
            avatarUrl: row.other_avatar_url,
          },
          lastMessage:
            row.last_message_id &&
            row.last_message_body &&
            row.last_message_created_at
              ? {
                  body: row.last_message_body,
                  createdAt: row.last_message_created_at,
                  isOwn: row.last_message_sender_id === userId,
                }
              : null,
        })),
      };
    }

    if (inboxError && process.env.NODE_ENV !== "production") {
      console.warn(
        `[QueryTimer] get_messages_inbox failed; using fallback inbox queries: ${inboxError.message}`
      );
    }

    return getMessagesInboxDataFallback({ supabase, userId });
  });
}

async function getMessagesInboxDataFallback({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<MessagesInboxData> {
  const { data: myMemberships } = await withQueryTimer(
    "messages-inbox:memberships",
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id, last_read_at")
      .eq("user_id", userId)
  );

  const membershipRows = (myMemberships ?? []) as MemberRow[];

  const conversationIds = membershipRows.map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return {
      conversations: [],
    };
  }

  const lastReadByConversation = new Map<string, string | null>(
    membershipRows.map((row) => [row.conversation_id, row.last_read_at])
  );

  const { data: conversations } = await withQueryTimer(
    "messages-inbox:conversations",
    supabase
      .from("conversations")
      .select("id, updated_at, created_at")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false })
  );

  const conversationRows = (conversations ?? []) as ConversationRow[];

  const { data: members } = await withQueryTimer(
    "messages-inbox:memberships",
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id, last_read_at")
      .in("conversation_id", conversationIds)
      .neq("user_id", userId)
  );

  const memberRows = (members ?? []) as MemberRow[];
  const otherUserIds = memberRows.map((member) => member.user_id);

  const profileMap = await mapProfiles({
    supabase,
    userIds: otherUserIds,
  });

  const otherUserByConversation = new Map<string, string>();

  for (const member of memberRows) {
    otherUserByConversation.set(member.conversation_id, member.user_id);
  }

  const { data: recentMessages } = await withQueryTimer(
    "messages-inbox:last-messages",
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(100)
  );

  const messageRows = (recentMessages ?? []) as MessageRow[];
  const lastMessageByConversation = new Map<string, MessageRow>();

  for (const message of messageRows) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message);
    }
  }

  const unreadByConversation = new Map<string, number>(
    conversationIds.map((conversationId) => [conversationId, 0])
  );
  const oldestLastReadAt = Array.from(lastReadByConversation.values())
    .filter(Boolean)
    .sort()[0];

  const unreadQuery = supabase
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId);

  const { data: unreadCandidates } = await withQueryTimer(
    "messages-inbox:unread-count",
    oldestLastReadAt ? unreadQuery.gt("created_at", oldestLastReadAt) : unreadQuery
  );

  for (const message of (unreadCandidates ?? []) as Pick<
    MessageRow,
    "conversation_id" | "sender_id" | "created_at"
  >[]) {
    const lastReadAt =
      lastReadByConversation.get(message.conversation_id) ??
      "1970-01-01T00:00:00.000Z";

    if (message.created_at <= lastReadAt) continue;

    unreadByConversation.set(
      message.conversation_id,
      (unreadByConversation.get(message.conversation_id) ?? 0) + 1
    );
  }

  const list: ConversationListItem[] = [];

  for (const conversation of conversationRows) {
    const otherUserId = otherUserByConversation.get(conversation.id);
    if (!otherUserId) continue;

    const otherUser = profileMap.get(otherUserId);
    if (!otherUser) continue;

    const lastMessage = lastMessageByConversation.get(conversation.id);

    list.push({
      id: conversation.id,
      updatedAt: conversation.updated_at,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      otherUser,
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.created_at,
            isOwn: lastMessage.sender_id === userId,
          }
        : null,
    });
  }

  return {
    conversations: list,
  };
}

export async function getMessageThreadDataByUsername({
  supabase,
  userId,
  username,
}: {
  supabase: SupabaseClient;
  userId: string;
  username: string;
}): Promise<MessageThreadData> {
  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
    notFound();
  }

  const { data: targetProfile } = await withQueryTimer(
    "message-thread:participants",
    supabase
      .from("public_profiles")
      .select("id, username, full_name, avatar_url, avatar_asset_id")
      .eq("username", normalizedUsername)
      .maybeSingle()
  );

  if (!targetProfile) {
    notFound();
  }

  if (targetProfile.id === userId) {
    notFound();
  }

  const conversationId = await getOrCreateDirectConversation({
    supabase,
    userId,
    targetUserId: targetProfile.id,
  });

  return getMessageThreadData({
    supabase,
    userId,
    conversationId,
  });
}

export async function getMessageThreadData({
  supabase,
  userId,
  conversationId,
}: {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
}): Promise<MessageThreadData> {
  return withTimer("message-thread:total", async () => {
    const { data: membership } = await withQueryTimer(
      "message-thread:conversation",
      supabase
        .from("conversation_members")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle()
    );

    if (!membership) {
      notFound();
    }

    const { data: members } = await withQueryTimer(
      "message-thread:participants",
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, last_read_at")
        .eq("conversation_id", conversationId)
    );

    const memberRows = (members ?? []) as MemberRow[];
    const otherMember = memberRows.find((member) => member.user_id !== userId);

    if (!otherMember) {
      notFound();
    }

    const profileMap = await mapProfiles({
      supabase,
      userIds: memberRows.map((member) => member.user_id),
    });

    const otherUser = profileMap.get(otherMember.user_id);

    if (!otherUser) {
      notFound();
    }

    const { data: messages } = await withQueryTimer(
      "message-thread:messages",
      supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(50)
    );

    const messageRows = ((messages ?? []) as MessageRow[]).reverse();

    const otherLastReadTime = otherMember.last_read_at
      ? new Date(otherMember.last_read_at).getTime()
      : 0;

    const mappedMessages: MessageThreadItem[] = messageRows.map((message) => {
      const sender = profileMap.get(message.sender_id);
      const isOwn = message.sender_id === userId;
      const messageTime = new Date(message.created_at).getTime();

      return {
        id: message.id,
        body: message.body,
        createdAt: message.created_at,
        isOwn,
        readStatus: isOwn
          ? otherLastReadTime >= messageTime
            ? "seen"
            : "sent"
          : null,
        sender: sender ?? {
          id: message.sender_id,
          username: "memories_user",
          fullName: "Memories User",
          avatarUrl: null,
        },
      };
    });

    return {
      conversationId,
      otherUser,
      messages: mappedMessages,
    };
  });
}
