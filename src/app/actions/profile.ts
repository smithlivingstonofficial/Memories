// src/app/actions/profile.ts

"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaAssetsCompletely } from "@/lib/media/delete-media";
import { cacheTags } from "@/lib/cache-tags";

export type UpdateProfileState = {
  message?: string;
  success?: boolean;
  errors?: {
    fullName?: string[];
    username?: string[];
    bio?: string[];
    avatarAssetId?: string[];
    coverAssetId?: string[];
    accountVisibility?: string[];
  };
};

const AccountVisibilitySchema = z.enum(["public", "private"]);

const optionalAssetId = z.preprocess((value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().uuid().nullable());

const UpdateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(80, "Full name is too long."),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username is too long.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscore."
    ),

  bio: z
    .string()
    .trim()
    .max(180, "Bio must be 180 characters or less.")
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),

  avatarAssetId: optionalAssetId,
  coverAssetId: optionalAssetId,
  accountVisibility: AccountVisibilitySchema,
});

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type VerifiedAsset = {
  id: string;
  public_url: string | null;
  object_key: string;
};

async function verifyProfileAsset({
  supabase,
  userId,
  assetId,
  purpose,
}: {
  supabase: SupabaseClient;
  userId: string;
  assetId: string | null;
  purpose: "profile_avatar" | "profile_cover";
}) {
  if (!assetId) return null;

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, public_url, object_key")
    .eq("id", assetId)
    .eq("owner_id", userId)
    .eq("upload_status", "uploaded")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Invalid ${purpose.replace("_", " ")} asset.`);
  }

  const { error: updateError } = await supabase
    .from("media_assets")
    .update({
      purpose,
      visibility: "public",
    })
    .eq("id", assetId)
    .eq("owner_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data as VerifiedAsset;
}

export async function updateProfileAction(
  _previousState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const validatedFields = UpdateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    bio: formData.get("bio"),
    avatarAssetId: formData.get("avatarAssetId"),
    coverAssetId: formData.get("coverAssetId"),
    accountVisibility: formData.get("accountVisibility"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    fullName,
    username,
    bio,
    avatarAssetId,
    coverAssetId,
    accountVisibility,
  } = validatedFields.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      message: "Your session expired. Please login again.",
    };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("avatar_asset_id, cover_asset_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: usernameOwner, error: usernameError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (usernameError) {
    return {
      message: usernameError.message,
    };
  }

  if (usernameOwner) {
    return {
      message: "This username is already taken.",
      errors: {
        username: ["This username is already taken."],
      },
    };
  }

  let avatarAsset: VerifiedAsset | null = null;
  let coverAsset: VerifiedAsset | null = null;

  try {
    avatarAsset = await verifyProfileAsset({
      supabase,
      userId: user.id,
      assetId: avatarAssetId,
      purpose: "profile_avatar",
    });

    coverAsset = await verifyProfileAsset({
      supabase,
      userId: user.id,
      assetId: coverAssetId,
      purpose: "profile_cover",
    });
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify uploaded profile media.",
    };
  }

  const oldAvatarAssetId =
    avatarAsset &&
    existingProfile?.avatar_asset_id &&
    existingProfile.avatar_asset_id !== avatarAsset.id
      ? existingProfile.avatar_asset_id
      : null;

  const oldCoverAssetId =
    coverAsset &&
    existingProfile?.cover_asset_id &&
    existingProfile.cover_asset_id !== coverAsset.id
      ? existingProfile.cover_asset_id
      : null;

  const profileUpdate: Record<string, unknown> = {
    username,
    full_name: fullName,
    bio,
    account_visibility: accountVisibility,
    updated_at: new Date().toISOString(),
  };

  if (avatarAsset) {
    profileUpdate.avatar_asset_id = avatarAsset.id;
    profileUpdate.avatar_url = avatarAsset.public_url;
  }

  if (coverAsset) {
    profileUpdate.cover_asset_id = coverAsset.id;
    profileUpdate.cover_url = coverAsset.public_url;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    return {
      message: profileError.message || "Unable to update profile.",
    };
  }

  const cleanupAssetIds = [oldAvatarAssetId, oldCoverAssetId].filter(
    (id): id is string => Boolean(id)
  );

  if (cleanupAssetIds.length > 0) {
    await deleteMediaAssetsCompletely({
      supabase,
      userId: user.id,
      assetIds: cleanupAssetIds,
    });
  }

  updateTag(cacheTags.userProfile(user.id));
  updateTag(cacheTags.userMemories(user.id));
  updateTag(cacheTags.homeFeed(user.id));

  redirect("/profile");
}
