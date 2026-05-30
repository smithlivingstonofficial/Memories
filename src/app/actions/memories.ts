"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizeMoods } from "@/lib/moods";

export type CreateMemoryState = {
  message?: string;
  errors?: {
    title?: string[];
    content?: string[];
    moods?: string[];
    privacy?: string[];
    locationName?: string[];
    tags?: string[];
    mediaAssetIds?: string[];
  };
};

export type CreateVaultEntryState = {
  message?: string;
  errors?: {
    title?: string[];
    content?: string[];
    moods?: string[];
    mediaAssetIds?: string[];
  };
};

const MemoryPrivacySchema = z.enum([
  "private",
  "inner_circle",
  "friends",
  "public",
]);

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max).nullable());

const MoodsSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeMoods(parsed);
  } catch {
    return [];
  }
}, z.array(z.string().min(1).max(40)).min(1, "Select at least one mood.").max(5, "You can select up to 5 moods only."));

const TagsSchema = z.preprocess((value) => {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}, z.array(z.string().min(1).max(30)));

const MediaAssetIdsSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}, z.array(z.string().uuid()).max(10));

const CreateMemorySchema = z.object({
  title: optionalText(120),

  content: z
    .string()
    .trim()
    .min(3, "Write at least a few words for your memory.")
    .max(5000, "Memory text is too long."),

  moods: MoodsSchema,

  privacy: MemoryPrivacySchema,

  locationName: optionalText(120),

  tags: TagsSchema,

  mediaAssetIds: MediaAssetIdsSchema,
});

const CreateVaultEntrySchema = z.object({
  title: optionalText(120),

  content: z
    .string()
    .trim()
    .min(3, "Write at least a few words for your Vault entry.")
    .max(8000, "Vault entry is too long."),

  moods: MoodsSchema,

  mediaAssetIds: MediaAssetIdsSchema,
});

function getAssetVisibility(
  privacy: z.infer<typeof MemoryPrivacySchema>
): "private" | "inner_circle" | "public" {
  if (privacy === "public") return "public";
  if (privacy === "inner_circle") return "inner_circle";

  return "private";
}

/* -------------------------------------------------------------------------- */
/* CREATE MEMORY ACTION                                                       */
/* -------------------------------------------------------------------------- */

export async function createMemoryAction(
  _previousState: CreateMemoryState,
  formData: FormData
): Promise<CreateMemoryState> {
  const validatedFields = CreateMemorySchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    moods: formData.get("moods"),
    privacy: formData.get("privacy"),
    locationName: formData.get("locationName"),
    tags: formData.get("tags"),
    mediaAssetIds: formData.get("mediaAssetIds"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    title,
    content,
    moods,
    privacy,
    locationName,
    tags,
    mediaAssetIds,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  if (mediaAssetIds.length > 0) {
    const { data: uploadedAssets, error: assetsError } = await supabase
      .from("media_assets")
      .select("id")
      .eq("owner_id", user.id)
      .eq("upload_status", "uploaded")
      .in("id", mediaAssetIds);

    if (assetsError) {
      return {
        message: assetsError.message || "Unable to verify uploaded media.",
      };
    }

    if ((uploadedAssets?.length ?? 0) !== mediaAssetIds.length) {
      return {
        message: "Some uploaded media files are invalid or not completed.",
      };
    }

    const { error: mediaUpdateError } = await supabase
      .from("media_assets")
      .update({
        purpose: "memory",
        visibility: getAssetVisibility(privacy),
      })
      .eq("owner_id", user.id)
      .in("id", mediaAssetIds);

    if (mediaUpdateError) {
      return {
        message: mediaUpdateError.message || "Unable to update media privacy.",
      };
    }
  }

  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .insert({
      owner_id: user.id,
      title,
      content,
      mood: moods[0] ?? null,
      moods,
      privacy,
      location_name: locationName,
      tags,
    })
    .select("id")
    .single();

  if (memoryError || !memory) {
    return {
      message: memoryError?.message || "Unable to save memory.",
    };
  }

  if (mediaAssetIds.length > 0) {
    const rows = mediaAssetIds.map((assetId, index) => ({
      memory_id: memory.id,
      asset_id: assetId,
      owner_id: user.id,
      sort_order: index,
    }));

    const { error: memoryMediaError } = await supabase
      .from("memory_media")
      .insert(rows);

    if (memoryMediaError) {
      return {
        message:
          memoryMediaError.message ||
          "Memory saved, but media attachment failed.",
      };
    }
  }

  redirect("/home");
}

/* -------------------------------------------------------------------------- */
/* CREATE VAULT ENTRY ACTION                                                  */
/* -------------------------------------------------------------------------- */

export async function createVaultEntryAction(
  _previousState: CreateVaultEntryState,
  formData: FormData
): Promise<CreateVaultEntryState> {
  const validatedFields = CreateVaultEntrySchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    moods: formData.get("moods"),
    mediaAssetIds: formData.get("mediaAssetIds"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, content, moods, mediaAssetIds } = validatedFields.data;

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  if (mediaAssetIds.length > 0) {
    const { data: uploadedAssets, error: assetsError } = await supabase
      .from("media_assets")
      .select("id")
      .eq("owner_id", user.id)
      .eq("upload_status", "uploaded")
      .in("id", mediaAssetIds);

    if (assetsError) {
      return {
        message: assetsError.message || "Unable to verify uploaded media.",
      };
    }

    if ((uploadedAssets?.length ?? 0) !== mediaAssetIds.length) {
      return {
        message: "Some uploaded media files are invalid or not completed.",
      };
    }

    const { error: mediaUpdateError } = await supabase
      .from("media_assets")
      .update({
        purpose: "vault",
        visibility: "private",
      })
      .eq("owner_id", user.id)
      .in("id", mediaAssetIds);

    if (mediaUpdateError) {
      return {
        message:
          mediaUpdateError.message || "Unable to update Vault media privacy.",
      };
    }
  }

  const { data: vaultEntry, error: vaultError } = await supabase
    .from("memories")
    .insert({
      owner_id: user.id,
      title,
      content,
      mood: moods[0] ?? null,
      moods,
      privacy: "vault",
      location_name: null,
      tags: [],
    })
    .select("id")
    .single();

  if (vaultError || !vaultEntry) {
    return {
      message: vaultError?.message || "Unable to save Vault entry.",
    };
  }

  if (mediaAssetIds.length > 0) {
    const rows = mediaAssetIds.map((assetId, index) => ({
      memory_id: vaultEntry.id,
      asset_id: assetId,
      owner_id: user.id,
      sort_order: index,
    }));

    const { error: memoryMediaError } = await supabase
      .from("memory_media")
      .insert(rows);

    if (memoryMediaError) {
      return {
        message:
          memoryMediaError.message ||
          "Vault entry saved, but media attachment failed.",
      };
    }
  }

  redirect("/vault");
}