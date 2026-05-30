"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaAssetsCompletely } from "@/lib/media/delete-media";

export type UpdateProfileState = {
  message?: string;
  success?: boolean;
  errors?: {
    fullName?: string[];
    username?: string[];
    bio?: string[];
    avatarAssetId?: string[];
    coverAssetId?: string[];
  };
};

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
    .max(30, "Username is too long.")
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
});

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
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
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
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, username, bio, avatarAssetId, coverAssetId } =
    validatedFields.data;

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

  const { data: existingPublicProfile } = await supabase
    .from("public_profiles")
    .select("avatar_asset_id, cover_asset_id")
    .eq("id", user.id)
    .maybeSingle();

  const oldAvatarAssetId =
    existingPublicProfile?.avatar_asset_id &&
    existingPublicProfile.avatar_asset_id !== avatarAssetId
      ? existingPublicProfile.avatar_asset_id
      : null;

  const oldCoverAssetId =
    existingPublicProfile?.cover_asset_id &&
    existingPublicProfile.cover_asset_id !== coverAssetId
      ? existingPublicProfile.cover_asset_id
      : null;

  const { data: usernameOwner, error: usernameError } = await supabase
    .from("public_profiles")
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

  const privateProfileUpdate: Record<string, unknown> = {
    username,
    full_name: fullName,
    bio,
    updated_at: new Date().toISOString(),
  };

  if (avatarAsset) {
    privateProfileUpdate.avatar_url = avatarAsset.public_url;
  }

  const { error: privateProfileError } = await supabase
    .from("profiles")
    .update(privateProfileUpdate)
    .eq("id", user.id);

  if (privateProfileError) {
    return {
      message: privateProfileError.message || "Unable to update profile.",
    };
  }

  const publicProfileUpdate: Record<string, unknown> = {
    id: user.id,
    username,
    full_name: fullName,
    bio,
    updated_at: new Date().toISOString(),
  };

  if (avatarAsset) {
    publicProfileUpdate.avatar_asset_id = avatarAsset.id;
    publicProfileUpdate.avatar_url = avatarAsset.public_url;
  }

  if (coverAsset) {
    publicProfileUpdate.cover_asset_id = coverAsset.id;
    publicProfileUpdate.cover_url = coverAsset.public_url;
  }

  const { error: publicProfileError } = await supabase
    .from("public_profiles")
    .upsert(publicProfileUpdate, {
      onConflict: "id",
    });

  if (publicProfileError) {
    return {
      message:
        publicProfileError.message || "Unable to update public profile.",
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

  redirect("/profile");
}