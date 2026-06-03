"use server";

import { revalidateTag, updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cacheTags } from "@/lib/cache-tags";

export type EngagementActionResult = {
  success: boolean;
  message: string;
  liked?: boolean;
  likeCount?: number;
};

export type CreateReflectionState = {
  success?: boolean;
  message?: string;
  reflectionId?: string;
};

const ReflectionSchema = z.object({
  memoryId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Write a reflection first.")
    .max(500, "Reflection must be 500 characters or less."),
});

type MemoryAccessRow = {
  id: string;
  owner_id: string;
  privacy: "private" | "followers" | "inner_circle" | "public" | "vault";
};

async function canEngageWithMemory({
  supabase,
  memoryId,
  userId,
}: {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  memoryId: string;
  userId: string;
}) {
  const { data: memory, error } = await supabase
    .from("memories")
    .select("id, owner_id, privacy")
    .eq("id", memoryId)
    .maybeSingle();

  if (error || !memory) return false;

  const row = memory as MemoryAccessRow;

  if (row.privacy === "vault") return false;
  if (row.owner_id === userId) return true;
  if (row.privacy === "public") return true;

  if (row.privacy === "followers") {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", row.owner_id)
      .eq("status", "accepted")
      .maybeSingle();

    return Boolean(followRow);
  }

  return false;
}

async function revalidateMemoryPages(memoryId: string) {
  updateTag(cacheTags.memory(memoryId));
  updateTag(cacheTags.memoryEngagement(memoryId));
}

export async function toggleMemoryLikeAction(
  memoryId: string
): Promise<EngagementActionResult> {
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

  const canEngage = await canEngageWithMemory({
    supabase,
    memoryId,
    userId: user.id,
  });

  if (!canEngage) {
    return {
      success: false,
      message: "You cannot like this memory.",
    };
  }

  const { data: existingLike } = await supabase
    .from("memory_likes")
    .select("id")
    .eq("memory_id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from("memory_likes")
      .delete()
      .eq("memory_id", memoryId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  } else {
    const { error } = await supabase.from("memory_likes").insert({
      memory_id: memoryId,
      user_id: user.id,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  const { count } = await supabase
    .from("memory_likes")
    .select("id", { count: "exact", head: true })
    .eq("memory_id", memoryId);

  await revalidateMemoryPages(memoryId);
  revalidateTag(cacheTags.homeFeed(user.id), "max");
  revalidateTag(cacheTags.userMemories(user.id), "max");

  return {
    success: true,
    message: existingLike ? "Like removed." : "Memory liked.",
    liked: !existingLike,
    likeCount: count ?? 0,
  };
}

export async function createReflectionAction(
  _previousState: CreateReflectionState,
  formData: FormData
): Promise<CreateReflectionState> {
  const validatedFields = ReflectionSchema.safeParse({
    memoryId: formData.get("memoryId"),
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        validatedFields.error.flatten().fieldErrors.content?.[0] ||
        "Please check your reflection.",
    };
  }

  const { memoryId, content } = validatedFields.data;

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

  const canEngage = await canEngageWithMemory({
    supabase,
    memoryId,
    userId: user.id,
  });

  if (!canEngage) {
    return {
      success: false,
      message: "You cannot reflect on this memory.",
    };
  }

  const { data: reflection, error } = await supabase
    .from("memory_reflections")
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      content,
    })
    .select("id")
    .single();

  if (error || !reflection) {
    return {
      success: false,
      message: error?.message || "Unable to save reflection.",
    };
  }

  await revalidateMemoryPages(memoryId);
  revalidateTag(cacheTags.homeFeed(user.id), "max");
  revalidateTag(cacheTags.userMemories(user.id), "max");

  return {
    success: true,
    message: "Reflection added.",
    reflectionId: reflection.id,
  };
}

export async function deleteReflectionAction(reflectionId: string): Promise<{
  success: boolean;
  message: string;
  reflectionCount?: number;
}> {
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

  const { data: reflection, error: reflectionError } = await supabase
    .from("memory_reflections")
    .select("id, memory_id, user_id")
    .eq("id", reflectionId)
    .maybeSingle();

  if (reflectionError) {
    return {
      success: false,
      message: reflectionError.message,
    };
  }

  if (!reflection) {
    return {
      success: false,
      message: "Reflection not found.",
    };
  }

  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .select("id, owner_id")
    .eq("id", reflection.memory_id)
    .maybeSingle();

  if (memoryError || !memory) {
    return {
      success: false,
      message: memoryError?.message || "Memory not found.",
    };
  }

  const canDelete =
    reflection.user_id === user.id || memory.owner_id === user.id;

  if (!canDelete) {
    return {
      success: false,
      message: "You do not have permission to delete this reflection.",
    };
  }

  const { error: deleteError } = await supabase
    .from("memory_reflections")
    .delete()
    .eq("id", reflectionId);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  const { count } = await supabase
    .from("memory_reflections")
    .select("id", { count: "exact", head: true })
    .eq("memory_id", reflection.memory_id);

  updateTag(cacheTags.memory(reflection.memory_id));
  updateTag(cacheTags.memoryEngagement(reflection.memory_id));
  revalidateTag(cacheTags.homeFeed(user.id), "max");
  revalidateTag(cacheTags.userMemories(user.id), "max");

  return {
    success: true,
    message: "Reflection deleted.",
    reflectionCount: count ?? 0,
  };
}
