"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaAssetsCompletely } from "@/lib/media/delete-media";
import { normalizeMoods } from "@/lib/moods";

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
    entryDate: formData.get("entryDate"),
    entryTimezone: formData.get("entryTimezone"),
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
    entryDate,
    entryTimezone,
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
      entry_date: entryDate,
      entry_timezone: entryTimezone || "Asia/Kolkata",
      media_count: mediaAssetIds.length,
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
      await supabase
        .from("memories")
        .update({
          media_count: 0,
        })
        .eq("id", memory.id)
        .eq("owner_id", user.id);

      return {
        message:
          memoryMediaError.message ||
          "Memory saved, but media attachment failed.",
      };
    }
  }

  revalidatePath("/home");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/timeline");
  revalidatePath("/profile");
  revalidatePath("/create/memory");
  revalidatePath(`/diary/day/${entryDate}`);
  revalidatePath(`/memory/${memory.id}`);

  redirect(`/diary/day/${entryDate}`);
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
      location_name: null,
      tags: [],
      entry_date: entryDate,
      entry_timezone: "Asia/Kolkata",
      media_count: mediaAssetIds.length,
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
      await supabase
        .from("memories")
        .update({
          media_count: 0,
        })
        .eq("id", vaultEntry.id)
        .eq("owner_id", user.id);

      return {
        message:
          memoryMediaError.message ||
          "Vault entry saved, but media attachment failed.",
      };
    }
  }

  revalidatePath("/home");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/timeline");
  revalidatePath("/vault");
  revalidatePath(`/diary/day/${entryDate}`);

  redirect("/vault");
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

  revalidatePath("/home");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/timeline");
  revalidatePath("/profile");
  revalidatePath("/vault");

  if (memory.entry_date) {
    revalidatePath(`/diary/day/${memory.entry_date}`);
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