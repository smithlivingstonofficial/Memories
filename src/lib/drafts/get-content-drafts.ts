import "server-only";

import { mapContentDraftRow, mapHomeDraftRow } from "@/lib/drafts/map-content-draft";
import type { ContentDraft, HomeDraft } from "@/types/draft";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export async function getHomeDrafts({
  supabase,
  userId,
  limit = 8,
}: {
  supabase: SupabaseClient;
  userId: string;
  limit?: number;
}): Promise<HomeDraft[]> {
  const { data, error } = await supabase
    .from("content_drafts")
    .select(
      `
      id,
      owner_id,
      draft_type,
      status,
      title,
      content,
      caption,
      moods,
      privacy,
      visibility,
      entry_date,
      entry_timezone,
      location_name,
      location_label,
      latitude,
      longitude,
      location_source,
      location_confidence,
      location_accuracy_meters,
      tags,
      metadata,
      created_at,
      updated_at,
      content_draft_media ( id )
    `
    )
    .eq("owner_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapHomeDraftRow(row as Parameters<typeof mapHomeDraftRow>[0]));
}

export async function getContentDraftForCreate({
  supabase,
  userId,
  draftId,
  draftType,
}: {
  supabase: SupabaseClient;
  userId: string;
  draftId?: string | null;
  draftType: ContentDraft["draftType"];
}): Promise<ContentDraft | null> {
  if (!draftId) return null;

  const { data: draft, error } = await supabase
    .from("content_drafts")
    .select(
      "id, owner_id, draft_type, status, title, content, caption, moods, privacy, visibility, entry_date, entry_timezone, location_name, location_label, latitude, longitude, location_source, location_confidence, location_accuracy_meters, tags, metadata, created_at, updated_at"
    )
    .eq("id", draftId)
    .eq("owner_id", userId)
    .eq("draft_type", draftType)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!draft) return null;

  const { data: mediaRows, error: mediaError } = await supabase
    .from("content_draft_media")
    .select("id, media_asset_id, object_key, public_url, file_name, mime_type, media_kind, size_bytes, sort_order, upload_status, metadata")
    .eq("draft_id", draftId)
    .eq("owner_id", userId)
    .neq("upload_status", "deleted")
    .order("sort_order", { ascending: true });

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  return mapContentDraftRow(
    draft as Parameters<typeof mapContentDraftRow>[0],
    (mediaRows ?? []) as Parameters<typeof mapContentDraftRow>[1]
  );
}
