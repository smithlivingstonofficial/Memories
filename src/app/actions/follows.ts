"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowActionResult = {
  success: boolean;
  message: string;
};

export async function followUserAction(
  targetUserId: string
): Promise<FollowActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  if (user.id === targetUserId) {
    return {
      success: false,
      message: "You cannot follow yourself.",
    };
  }

  const { data: targetProfile, error: profileError } = await supabase
    .from("public_profiles")
    .select("username, account_visibility")
    .eq("id", targetUserId)
    .maybeSingle();

  if (profileError || !targetProfile) {
    return {
      success: false,
      message: "User profile not found.",
    };
  }

  const nextStatus =
    targetProfile.account_visibility === "private" ? "pending" : "accepted";

  const { error } = await supabase.from("user_follows").upsert(
    {
      follower_id: user.id,
      following_id: targetUserId,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "follower_id,following_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/u/${targetProfile.username}`);
  revalidatePath("/profile");
  revalidatePath("/requests");

  return {
    success: true,
    message:
      nextStatus === "pending"
        ? "Follow request sent."
        : "You are now following this user.",
  };
}

export async function cancelFollowAction(
  targetUserId: string
): Promise<FollowActionResult> {
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

  const { data: targetProfile } = await supabase
    .from("public_profiles")
    .select("username")
    .eq("id", targetUserId)
    .maybeSingle();

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (targetProfile?.username) {
    revalidatePath(`/u/${targetProfile.username}`);
  }

  revalidatePath("/profile");
  revalidatePath("/requests");

  return {
    success: true,
    message: "Follow request cancelled.",
  };
}

export async function unfollowUserAction(
  targetUserId: string
): Promise<FollowActionResult> {
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

  const { data: targetProfile } = await supabase
    .from("public_profiles")
    .select("username")
    .eq("id", targetUserId)
    .maybeSingle();

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .eq("status", "accepted");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (targetProfile?.username) {
    revalidatePath(`/u/${targetProfile.username}`);
  }

  revalidatePath("/profile");
  revalidatePath("/requests");

  return {
    success: true,
    message: "Unfollowed successfully.",
  };
}

export async function respondFollowRequestAction({
  followerId,
  response,
}: {
  followerId: string;
  response: "accept" | "decline";
}): Promise<FollowActionResult> {
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

  const { data: currentProfile } = await supabase
    .from("public_profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (response === "accept") {
    const { error } = await supabase
      .from("user_follows")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("follower_id", followerId)
      .eq("following_id", user.id)
      .eq("status", "pending");

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/requests");
    revalidatePath("/profile");

    if (currentProfile?.username) {
      revalidatePath(`/u/${currentProfile.username}`);
    }

    return {
      success: true,
      message: "Follow request accepted.",
    };
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", "pending");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/requests");
  revalidatePath("/profile");

  if (currentProfile?.username) {
    revalidatePath(`/u/${currentProfile.username}`);
  }

  return {
    success: true,
    message: "Follow request declined.",
  };
}