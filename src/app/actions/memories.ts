"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaAssetsCompletely } from "@/lib/media/delete-media";
import { cacheTags } from "@/lib/cache-tags";
import { normalizeMoods } from "@/lib/moods";
import { requireVaultUnlocked } from "@/lib/vault/access";

export type CreateMemoryState = {
  message?: string;
  errors?: {
    entryDate?: string[];
    entryTimezone?: string[];
    title?: string[];
    content?: string[];
    moods?: string[];
    privacy?: string[];
    locationName?: string[];
    latitude?: string[];
    longitude?: string[];
    locationLabel?: string[];
    locationSource?: string[];
    locationConfidence?: string[];
    locationAccuracyMeters?: string[];
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
    locationName?: string[];
    latitude?: string[];
    longitude?: string[];
    locationLabel?: string[];
    locationSource?: string[];
    locationConfidence?: string[];
    locationAccuracyMeters?: string[];
    tags?: string[];
    mediaAssetIds?: string[];
  };
};

export type EditMemoryState = {
  message?: string;
  errors?: CreateMemoryState["errors"] &
    CreateVaultEntryState["errors"] & {
      memoryId?: string[];
      existingMediaAssetIds?: string[];
    };
};

const MemoryPrivacySchema = z.enum([
  "private",
  "followers",
  "inner_circle",
  "public",
  "vault",
]);

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max).nullable());

const EntryDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid diary date.")
  .refine((value) => isValidEntryDate(value), "Invalid diary date.");

const EntryTimezoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "Asia/Kolkata";

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Asia/Kolkata";
}, z.string().max(80));

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

const LocationSourceSchema = z.enum([
  "manual",
  "browser_gps",
  "media_gps",
  "mixed_media",
  "unknown",
]);

const optionalNumber = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}, z.number().nullable());

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
  entryDate: EntryDateSchema,

  entryTimezone: EntryTimezoneSchema,

  title: optionalText(120),

  content: z
    .string()
    .trim()
    .min(3, "Write at least a few words for your memory.")
    .max(5000, "Memory text is too long."),

  moods: MoodsSchema,

  privacy: MemoryPrivacySchema,

  locationName: optionalText(120),
  locationLabel: optionalText(160),
  latitude: optionalNumber.refine(
    (value) => value === null || (value >= -90 && value <= 90),
    "Invalid latitude."
  ),
  longitude: optionalNumber.refine(
    (value) => value === null || (value >= -180 && value <= 180),
    "Invalid longitude."
  ),
  locationSource: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return "unknown";
    }

    return value;
  }, LocationSourceSchema),
  locationConfidence: optionalNumber.refine(
    (value) => value === null || (value >= 0 && value <= 1),
    "Invalid location confidence."
  ),
  locationAccuracyMeters: optionalNumber.refine(
    (value) => value === null || value >= 0,
    "Invalid location accuracy."
  ),

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

  locationName: optionalText(120),
  locationLabel: optionalText(160),
  latitude: optionalNumber.refine(
    (value) => value === null || (value >= -90 && value <= 90),
    "Invalid latitude."
  ),
  longitude: optionalNumber.refine(
    (value) => value === null || (value >= -180 && value <= 180),
    "Invalid longitude."
  ),
  locationSource: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return "unknown";
    }

    return value;
  }, LocationSourceSchema),
  locationConfidence: optionalNumber.refine(
    (value) => value === null || (value >= 0 && value <= 1),
    "Invalid location confidence."
  ),
  locationAccuracyMeters: optionalNumber.refine(
    (value) => value === null || value >= 0,
    "Invalid location accuracy."
  ),

  tags: TagsSchema,

  mediaAssetIds: MediaAssetIdsSchema,
});

const ExistingMediaAssetIdsSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}, z.array(z.string().uuid()).max(10));

const EditMemorySchema = CreateMemorySchema.extend({
  memoryId: z.string().uuid(),
  existingMediaAssetIds: ExistingMediaAssetIdsSchema,
}).refine(
  (value) => value.existingMediaAssetIds.length + value.mediaAssetIds.length <= 10,
  {
    path: ["mediaAssetIds"],
    message: "You can attach up to 10 media files only.",
  }
);

type EditMemoryInput = z.infer<typeof EditMemorySchema>;

function getAssetVisibility(
  privacy: z.infer<typeof MemoryPrivacySchema>
): "private" | "inner_circle" | "public" {
  if (privacy === "public") return "public";
  if (privacy === "inner_circle") return "inner_circle";

  return "private";
}

function getMediaPurpose(
  privacy: z.infer<typeof MemoryPrivacySchema>
): "memory" | "vault" {
  return privacy === "vault" ? "vault" : "memory";
}

function updateUserContentTags(userId: string) {
  updateTag(cacheTags.userMemories(userId));
  updateTag(cacheTags.userDiary(userId));
  updateTag(cacheTags.userProfile(userId));
  updateTag(cacheTags.homeFeed(userId));
}

function updateVaultTags(userId: string) {
  updateTag(cacheTags.userVault(userId));
}

function updateMemoryTags(memoryId: string) {
  updateTag(cacheTags.memory(memoryId));
  revalidateTag(cacheTags.memoryEngagement(memoryId), "max");
}

/* -------------------------------------------------------------------------- */
/* CREATE MEMORY ACTION                                                       */
/* -------------------------------------------------------------------------- */

export async function createMemoryAction(
  _previousState: CreateMemoryState,
  formData: FormData
): Promise<CreateMemoryState> {
  const validatedFields = CreateMemorySchema.safeParse({
    entryDate: formData.get("entryDate"),
    entryTimezone: formData.get("entryTimezone"),
    title: formData.get("title"),
    content: formData.get("content"),
    moods: formData.get("moods"),
    privacy: formData.get("privacy"),
    locationName: formData.get("locationName"),
    locationLabel: formData.get("locationLabel"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationSource: formData.get("locationSource"),
    locationConfidence: formData.get("locationConfidence"),
    locationAccuracyMeters: formData.get("locationAccuracyMeters"),
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
    entryDate,
    entryTimezone,
    title,
    content,
    moods,
    privacy,
    locationName,
    locationLabel,
    latitude,
    longitude,
    locationSource,
    locationConfidence,
    locationAccuracyMeters,
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

  if (privacy === "vault") {
    const unlocked = await requireVaultUnlocked(supabase, user.id);

    if (!unlocked) {
      return {
        message: "Unlock your Vault before saving this memory to Vault.",
      };
    }
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
        purpose: getMediaPurpose(privacy),
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
      location_name: locationLabel ?? locationName,
      location_label: locationLabel ?? locationName,
      latitude,
      longitude,
      location_source:
        latitude !== null && longitude !== null ? locationSource : "unknown",
      location_confidence: locationConfidence,
      location_accuracy_meters: locationAccuracyMeters,
      tags,
      entry_date: entryDate,
      entry_timezone: entryTimezone || "Asia/Kolkata",
      media_count: mediaAssetIds.length,
    })
    .select("id")
    .single();

  if (memoryError || !memory) {
    if (mediaAssetIds.length > 0) {
      await deleteMediaAssetsCompletely({
        supabase,
        userId: user.id,
        assetIds: mediaAssetIds,
      });
    }

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
      await supabase
        .from("memories")
        .delete()
        .eq("id", memory.id)
        .eq("owner_id", user.id);

      await deleteMediaAssetsCompletely({
        supabase,
        userId: user.id,
        assetIds: mediaAssetIds,
      });

      return {
        message:
          memoryMediaError.message ||
          "Memory saved, but media attachment failed.",
      };
    }
  }

  updateUserContentTags(user.id);
  updateMemoryTags(memory.id);

  if (privacy === "vault") {
    updateVaultTags(user.id);
  }

  redirect(privacy === "vault" ? "/vault" : `/diary/day/${entryDate}`);
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
    locationName: formData.get("locationName"),
    locationLabel: formData.get("locationLabel"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationSource: formData.get("locationSource"),
    locationConfidence: formData.get("locationConfidence"),
    locationAccuracyMeters: formData.get("locationAccuracyMeters"),
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
    locationName,
    locationLabel,
    latitude,
    longitude,
    locationSource,
    locationConfidence,
    locationAccuracyMeters,
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

  const vaultUnlocked = await requireVaultUnlocked(supabase, user.id);

  if (!vaultUnlocked) {
    return {
      message: "Unlock your Vault before saving a Vault entry.",
    };
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

  const entryDate = getTodayInTimeZone();

  const { data: vaultEntry, error: vaultError } = await supabase
    .from("memories")
    .insert({
      owner_id: user.id,
      title,
      content,
      mood: moods[0] ?? null,
      moods,
      privacy: "vault",
      location_name: locationLabel ?? locationName,
      location_label: locationLabel ?? locationName,
      latitude,
      longitude,
      location_source:
        latitude !== null && longitude !== null ? locationSource : "unknown",
      location_confidence: locationConfidence,
      location_accuracy_meters: locationAccuracyMeters,
      tags,
      entry_date: entryDate,
      entry_timezone: "Asia/Kolkata",
      media_count: mediaAssetIds.length,
    })
    .select("id")
    .single();

  if (vaultError || !vaultEntry) {
    if (mediaAssetIds.length > 0) {
      await deleteMediaAssetsCompletely({
        supabase,
        userId: user.id,
        assetIds: mediaAssetIds,
      });
    }

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
      await supabase
        .from("memories")
        .delete()
        .eq("id", vaultEntry.id)
        .eq("owner_id", user.id);

      await deleteMediaAssetsCompletely({
        supabase,
        userId: user.id,
        assetIds: mediaAssetIds,
      });

      return {
        message:
          memoryMediaError.message ||
          "Vault entry saved, but media attachment failed.",
      };
    }
  }

  updateUserContentTags(user.id);
  updateVaultTags(user.id);
  updateMemoryTags(vaultEntry.id);

  redirect("/vault");
}

/* -------------------------------------------------------------------------- */
/* EDIT MEMORY / VAULT ENTRY ACTION                                           */
/* -------------------------------------------------------------------------- */

export async function editMemoryAction(
  _previousState: EditMemoryState,
  formData: FormData
): Promise<EditMemoryState> {
  const mode = formData.get("mode") === "vault" ? "vault" : "memory";
  const payload = {
    memoryId: formData.get("memoryId"),
    entryDate: formData.get("entryDate"),
    entryTimezone: formData.get("entryTimezone"),
    title: formData.get("title"),
    content: formData.get("content"),
    moods: formData.get("moods"),
    privacy: formData.get("privacy"),
    locationName: formData.get("locationName"),
    locationLabel: formData.get("locationLabel"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationSource: formData.get("locationSource"),
    locationConfidence: formData.get("locationConfidence"),
    locationAccuracyMeters: formData.get("locationAccuracyMeters"),
    tags: formData.get("tags"),
    existingMediaAssetIds: formData.get("existingMediaAssetIds"),
    mediaAssetIds: formData.get("mediaAssetIds"),
  };

  const validatedFields = EditMemorySchema.safeParse(payload);

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

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

  const editData = validatedFields.data as EditMemoryInput;

  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .select("id, owner_id, privacy, entry_date")
    .eq("id", editData.memoryId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (memoryError) {
    return { message: memoryError.message };
  }

  if (!memory) {
    return {
      message:
        mode === "vault"
          ? "Vault entry not found or you do not have permission to edit it."
          : "Memory not found or you do not have permission to edit it.",
    };
  }

  if (memory.privacy === "vault" || editData.privacy === "vault") {
    const unlocked = await requireVaultUnlocked(supabase, user.id);

    if (!unlocked) {
      return {
        message: "Unlock your Vault before changing Vault privacy.",
      };
    }
  }

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from("memory_media")
    .select("asset_id")
    .eq("memory_id", editData.memoryId)
    .eq("owner_id", user.id);

  if (currentLinksError) {
    return { message: currentLinksError.message };
  }

  const currentAssetIds = ((currentLinks ?? []) as { asset_id: string | null }[])
    .map((item) => item.asset_id)
    .filter((id): id is string => Boolean(id));
  const currentAssetIdSet = new Set(currentAssetIds);
  const keptExistingAssetIds = Array.from(
    new Set(
      editData.existingMediaAssetIds.filter((assetId) =>
        currentAssetIdSet.has(assetId)
      )
    )
  );
  const newAssetIds = Array.from(
    new Set(
      editData.mediaAssetIds.filter((assetId) => !currentAssetIdSet.has(assetId))
    )
  );
  const nextAssetIds = [...keptExistingAssetIds, ...newAssetIds];
  const removedAssetIds = currentAssetIds.filter(
    (assetId) => !nextAssetIds.includes(assetId)
  );

  if (newAssetIds.length > 0) {
    const { data: uploadedAssets, error: assetsError } = await supabase
      .from("media_assets")
      .select("id")
      .eq("owner_id", user.id)
      .eq("upload_status", "uploaded")
      .in("id", newAssetIds);

    if (assetsError) {
      return {
        message: assetsError.message || "Unable to verify uploaded media.",
      };
    }

    if ((uploadedAssets?.length ?? 0) !== newAssetIds.length) {
      return {
        message: "Some uploaded media files are invalid or not completed.",
      };
    }
  }

  const visibility = getAssetVisibility(editData.privacy);
  const mediaPurpose = getMediaPurpose(editData.privacy);

  if (nextAssetIds.length > 0) {
    const { error: mediaUpdateError } = await supabase
      .from("media_assets")
      .update({
        purpose: mediaPurpose,
        visibility,
      })
      .eq("owner_id", user.id)
      .in("id", nextAssetIds);

    if (mediaUpdateError) {
      return {
        message: mediaUpdateError.message || "Unable to update media privacy.",
      };
    }
  }

  const updatePayload = {
    title: editData.title,
    content: editData.content,
    mood: editData.moods[0] ?? null,
    moods: editData.moods,
    privacy: editData.privacy,
    location_name: editData.locationLabel ?? editData.locationName,
    location_label: editData.locationLabel ?? editData.locationName,
    latitude: editData.latitude,
    longitude: editData.longitude,
    location_source:
      editData.latitude !== null && editData.longitude !== null
        ? editData.locationSource
        : "unknown",
    location_confidence: editData.locationConfidence,
    location_accuracy_meters: editData.locationAccuracyMeters,
    tags: editData.tags,
    entry_date: editData.entryDate,
    entry_timezone: editData.entryTimezone || "Asia/Kolkata",
    media_count: nextAssetIds.length,
  };

  const { error: updateError } = await supabase
    .from("memories")
    .update(updatePayload)
    .eq("id", editData.memoryId)
    .eq("owner_id", user.id);

  if (updateError) {
    return {
      message: updateError.message || "Unable to update memory.",
    };
  }

  if (removedAssetIds.length > 0) {
    const { error: deleteLinksError } = await supabase
      .from("memory_media")
      .delete()
      .eq("memory_id", editData.memoryId)
      .eq("owner_id", user.id)
      .in("asset_id", removedAssetIds);

    if (deleteLinksError) {
      await supabase
        .from("memories")
        .update({ media_count: currentAssetIds.length })
        .eq("id", editData.memoryId)
        .eq("owner_id", user.id);

      return {
        message:
          deleteLinksError.message || "Memory updated, but media sync failed.",
      };
    }
  }

  if (newAssetIds.length > 0) {
    const rows = newAssetIds.map((assetId) => ({
      memory_id: editData.memoryId,
      asset_id: assetId,
      owner_id: user.id,
      sort_order: nextAssetIds.indexOf(assetId),
    }));

    const { error: insertLinksError } = await supabase
      .from("memory_media")
      .insert(rows);

    if (insertLinksError) {
      await deleteMediaAssetsCompletely({
        supabase,
        userId: user.id,
        assetIds: newAssetIds,
      });

      await supabase
        .from("memories")
        .update({ media_count: keptExistingAssetIds.length })
        .eq("id", editData.memoryId)
        .eq("owner_id", user.id);

      return {
        message:
          insertLinksError.message || "Memory updated, but media sync failed.",
      };
    }
  }

  for (const [index, assetId] of nextAssetIds.entries()) {
    await supabase
      .from("memory_media")
      .update({ sort_order: index })
      .eq("memory_id", editData.memoryId)
      .eq("owner_id", user.id)
      .eq("asset_id", assetId);
  }

  if (removedAssetIds.length > 0) {
    await deleteMediaAssetsCompletely({
      supabase,
      userId: user.id,
      assetIds: removedAssetIds,
    });
  }

  updateUserContentTags(user.id);
  updateMemoryTags(editData.memoryId);

  if (memory.privacy === "vault" || editData.privacy === "vault") {
    updateVaultTags(user.id);
  }

  redirect(
    editData.privacy === "vault"
      ? "/vault"
      : `/memory/${editData.memoryId}`
  );
}

/* -------------------------------------------------------------------------- */
/* DELETE MEMORY / VAULT ENTRY ACTION                                         */
/* -------------------------------------------------------------------------- */

export async function deleteMemoryAction(memoryId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Your session expired. Please login again.",
    };
  }

  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .select("id, owner_id, privacy, entry_date")
    .eq("id", memoryId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (memoryError) {
    return {
      success: false,
      message: memoryError.message,
    };
  }

  if (!memory) {
    return {
      success: false,
      message: "Memory not found or you do not have permission to delete it.",
    };
  }

  if (memory.privacy === "vault") {
    const unlocked = await requireVaultUnlocked(supabase, user.id);

    if (!unlocked) {
      return {
        success: false,
        message: "Unlock your Vault before deleting a Vault entry.",
      };
    }
  }

  const { data: mediaLinks, error: mediaLinksError } = await supabase
    .from("memory_media")
    .select("asset_id")
    .eq("memory_id", memoryId)
    .eq("owner_id", user.id);

  if (mediaLinksError) {
    return {
      success: false,
      message: mediaLinksError.message,
    };
  }

  const assetIds = ((mediaLinks ?? []) as { asset_id: string | null }[])
    .map((item) => item.asset_id)
    .filter((id): id is string => Boolean(id));

  const { error: deleteLinksError } = await supabase
    .from("memory_media")
    .delete()
    .eq("memory_id", memoryId)
    .eq("owner_id", user.id);

  if (deleteLinksError) {
    return {
      success: false,
      message: deleteLinksError.message,
    };
  }

  const { error: deleteMemoryError } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("owner_id", user.id);

  if (deleteMemoryError) {
    return {
      success: false,
      message: deleteMemoryError.message,
    };
  }

  if (assetIds.length > 0) {
    await deleteMediaAssetsCompletely({
      supabase,
      userId: user.id,
      assetIds,
    });
  }

  updateUserContentTags(user.id);
  updateMemoryTags(memoryId);

  if (memory.privacy === "vault") {
    updateVaultTags(user.id);
  }

  return {
    success: true,
    message:
      memory.privacy === "vault"
        ? "Vault entry and attached media deleted."
        : "Memory and attached media deleted.",
  };
}

function getTodayInTimeZone(timeZone = "Asia/Kolkata") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function isValidEntryDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
