// src/lib/messages/get-messages-data.ts

import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";

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

async function resolveAvatarUrl(
  supabase: SupabaseClient,
  assetId: string | null,
  fallbackUrl: string | null
) {
  if (fallbackUrl) return fallbackUrl;
  if (!assetId) return null;

  const { data: asset } = await supabase
    .from("media_assets")
    .select("object_key, public_url, upload_status")
    .eq("id", assetId)
    .eq("upload_status", "uploaded")
    .maybeSingle();

  if (!asset) return null;
  if (asset.public_url) return asset.public_url;

  if (asset.object_key) {
    return createSignedReadUrl(asset.object_key);
  }

  return null;
}

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
  const { data: targetProfile } = await supabase
    .from("public_profiles")
    .select("id, account_visibility")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!targetProfile) return false;

  if (targetProfile.account_visibility === "public") {
    return true;
  }

  const { data: acceptedConnection } = await supabase
    .from("user_follows")
    .select("id")
    .or(
      `and(follower_id.eq.${viewerId},following_id.eq.${targetUserId},status.eq.accepted),and(follower_id.eq.${targetUserId},following_id.eq.${viewerId},status.eq.accepted)`
    )
    .maybeSingle();

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

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .in("id", uniqueIds);

  const profileMap = new Map<string, ConversationListItem["otherUser"]>();

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    const avatarUrl = await resolveAvatarUrl(
      supabase,
      profile.avatar_asset_id,
      profile.avatar_url
    );

    profileMap.set(profile.id, {
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl,
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
  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, last_read_at")
    .eq("user_id", userId);

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

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, updated_at, created_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  const conversationRows = (conversations ?? []) as ConversationRow[];

  const { data: members } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, last_read_at")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

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

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(200);

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

  const { data: unreadCandidates } = oldestLastReadAt
    ? await unreadQuery.gt("created_at", oldestLastReadAt)
    : await unreadQuery;

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

  const { data: targetProfile } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .eq("username", normalizedUsername)
    .maybeSingle();

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
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: members } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, last_read_at")
    .eq("conversation_id", conversationId);

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

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  const messageRows = (messages ?? []) as MessageRow[];

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
}
