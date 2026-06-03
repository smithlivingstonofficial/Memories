"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cacheTags } from "@/lib/cache-tags";
import type { ContentDraftPayload } from "@/types/draft";

export type DraftActionResult = {
  success: boolean;
  message: string;
  draftId?: string;
  savedAt?: string;
};

const DraftTypeSchema = z.enum(["memory", "vault", "moment"]);

const OptionalTextSchema = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(8000).nullable());

const OptionalShortTextSchema = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(280).nullable());

const OptionalDateSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

const OptionalNumberSchema = z.preprocess((value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}, z.number().nullable());

const DraftMediaSchema = z.object({
  mediaAssetId: z.string().uuid().nullable().optional(),
  objectKey: z.string().max(500).nullable().optional(),
  publicUrl: z.string().max(1000).nullable().optional(),
  fileName: z.string().max(240).nullable().optional(),
  mimeType: z.string().max(120).nullable().optional(),
  mediaKind: z.enum(["image", "video", "audio", "document"]).nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  uploadStatus: z.enum(["pending", "uploaded", "deleted", "failed"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpsertDraftSchema = z.object({
  id: z.string().uuid().optional(),
  draftType: DraftTypeSchema,
  title: OptionalShortTextSchema.optional(),
  content: OptionalTextSchema.optional(),
  caption: OptionalShortTextSchema.optional(),
  moods: z.array(z.string().min(1).max(40)).max(5).optional(),
  privacy: z.string().max(40).nullable().optional(),
  visibility: z.string().max(40).nullable().optional(),
  entryDate: OptionalDateSchema.optional(),
  entryTimezone: z.string().max(80).nullable().optional(),
  locationName: z.string().max(120).nullable().optional(),
  locationLabel: z.string().max(160).nullable().optional(),
  latitude: OptionalNumberSchema.optional(),
  longitude: OptionalNumberSchema.optional(),
  locationSource: z.string().max(40).nullable().optional(),
  locationConfidence: OptionalNumberSchema.optional(),
  locationAccuracyMeters: OptionalNumberSchema.optional(),
  tags: z.array(z.string().min(1).max(30)).max(12).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  media: z.array(DraftMediaSchema).max(10).optional(),
});

function updateDraftTags(userId: string) {
  updateTag(cacheTags.userDrafts(userId));
  updateTag(cacheTags.homeFeed(userId));
}

export async function upsertContentDraftAction(
  payload: ContentDraftPayload
): Promise<DraftActionResult> {
  const parsed = UpsertDraftSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Draft data could not be saved.",
    };
  }

  const input = parsed.data;
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

  const draftPayload = {
    owner_id: user.id,
    draft_type: input.draftType,
    status: "active" as const,
    title: input.title ?? null,
    content: input.content ?? null,
    caption: input.caption ?? null,
    moods: input.moods ?? [],
    privacy: input.privacy ?? null,
    visibility: input.visibility ?? null,
    entry_date: input.entryDate ?? null,
    entry_timezone: input.entryTimezone ?? "Asia/Kolkata",
    location_name: input.locationName ?? null,
    location_label: input.locationLabel ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_source: input.locationSource ?? "unknown",
    location_confidence: input.locationConfidence ?? null,
    location_accuracy_meters: input.locationAccuracyMeters ?? null,
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
  };

  const query = input.id
    ? supabase
        .from("content_drafts")
        .update(draftPayload)
        .eq("id", input.id)
        .eq("owner_id", user.id)
        .select("id, updated_at")
        .single()
    : supabase
        .from("content_drafts")
        .insert(draftPayload)
        .select("id, updated_at")
        .single();

  const { data: draft, error } = await query;

  if (error || !draft) {
    return {
      success: false,
      message: error?.message || "Unable to save draft.",
    };
  }

  if (input.media) {
    const { error: deleteMediaError } = await supabase
      .from("content_draft_media")
      .delete()
      .eq("draft_id", draft.id)
      .eq("owner_id", user.id);

    if (deleteMediaError) {
      return {
        success: false,
        message: deleteMediaError.message,
        draftId: draft.id,
      };
    }

    const mediaRows = input.media
      .filter((media) => media.uploadStatus !== "deleted")
      .map((media, index) => ({
        draft_id: draft.id,
        owner_id: user.id,
        media_asset_id: media.mediaAssetId ?? null,
        object_key: media.objectKey ?? null,
        public_url: media.publicUrl ?? null,
        file_name: media.fileName ?? null,
        mime_type: media.mimeType ?? null,
        media_kind: media.mediaKind ?? null,
        size_bytes: media.sizeBytes ?? null,
        sort_order: media.sortOrder ?? index,
        upload_status: media.uploadStatus ?? "uploaded",
        metadata: media.metadata ?? {},
      }));

    if (mediaRows.length > 0) {
      const { error: insertMediaError } = await supabase
        .from("content_draft_media")
        .insert(mediaRows);

      if (insertMediaError) {
        return {
          success: false,
          message: insertMediaError.message,
          draftId: draft.id,
        };
      }
    }
  }

  updateDraftTags(user.id);

  return {
    success: true,
    message: "Draft saved.",
    draftId: draft.id,
    savedAt: draft.updated_at,
  };
}

export async function deleteContentDraftAction(
  draftId: string
): Promise<DraftActionResult> {
  const parsed = z.string().uuid().safeParse(draftId);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid draft.",
    };
  }

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

  const { error } = await supabase
    .from("content_drafts")
    .update({ status: "discarded" })
    .eq("id", parsed.data)
    .eq("owner_id", user.id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  await supabase
    .from("content_draft_media")
    .update({ upload_status: "deleted" })
    .eq("draft_id", parsed.data)
    .eq("owner_id", user.id);

  updateDraftTags(user.id);

  return {
    success: true,
    message: "Draft deleted.",
    draftId: parsed.data,
  };
}

export async function markContentDraftPublished({
  supabase,
  userId,
  draftId,
  publishedContentId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  draftId: FormDataEntryValue | null;
  publishedContentId?: string;
}) {
  const parsed = z.string().uuid().safeParse(draftId);

  if (!parsed.success) return;

  await supabase
    .from("content_drafts")
    .update({
      status: "published",
      published_content_id: publishedContentId ?? null,
    })
    .eq("id", parsed.data)
    .eq("owner_id", userId);

  updateDraftTags(userId);
}
