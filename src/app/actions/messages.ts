"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MessageActionResult = {
  success: boolean;
  message: string;
  conversationId?: string;
};

export type SendMessageState = {
  success?: boolean;
  message?: string;
};

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(2000, "Message is too long."),
});

function getDirectKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

async function canStartConversation({
  supabase,
  viewerId,
  targetUserId,
}: {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
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

export async function startDirectConversationAction(
  targetUserId: string
): Promise<MessageActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  if (user.id === targetUserId) {
    return {
      success: false,
      message: "You cannot message yourself.",
    };
  }

  const allowed = await canStartConversation({
    supabase,
    viewerId: user.id,
    targetUserId,
  });

  if (!allowed) {
    return {
      success: false,
      message:
        "This account is private. You can message after a follow request is accepted.",
    };
  }

  const directKey = getDirectKey(user.id, targetUserId);

  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("direct_key", directKey)
    .maybeSingle();

  if (existingConversation?.id) {
    return {
      success: true,
      message: "Conversation opened.",
      conversationId: existingConversation.id,
    };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      conversation_type: "direct",
      direct_key: directKey,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    return {
      success: false,
      message: conversationError?.message || "Unable to create conversation.",
    };
  }

  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
      },
      {
        conversation_id: conversation.id,
        user_id: targetUserId,
      },
    ]);

  if (membersError) {
    return {
      success: false,
      message: membersError.message,
    };
  }

  revalidatePath("/messages");

  return {
    success: true,
    message: "Conversation created.",
    conversationId: conversation.id,
  };
}

export async function sendMessageAction(
  _previousState: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const validatedFields = SendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        validatedFields.error.flatten().fieldErrors.body?.[0] ||
        "Please check your message.",
    };
  }

  const { conversationId, body } = validatedFields.data;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return {
      success: false,
      message: "You do not have permission to send messages here.",
    };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  await supabase
    .from("conversation_members")
    .update({
        last_read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return {
    success: true,
    message: "Message sent.",
  };
}

export async function markConversationReadAction(
  conversationId: string
): Promise<MessageActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("conversation_members")
    .update({
      last_read_at: now,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return {
    success: true,
    message: "Conversation marked as read.",
  };
}