import type { ContentDraft, ContentDraftMedia, HomeDraft } from "@/types/draft";

type DraftRow = {
  id: string;
  owner_id: string;
  draft_type: ContentDraft["draftType"];
  status: ContentDraft["status"];
  title: string | null;
  content: string | null;
  caption: string | null;
  moods: string[] | null;
  privacy: string | null;
  visibility: string | null;
  entry_date: string | null;
  entry_timezone: string | null;
  location_name: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: string | null;
  location_confidence: number | null;
  location_accuracy_meters: number | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type DraftMediaRow = {
  id: string;
  media_asset_id: string | null;
  object_key: string | null;
  public_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  media_kind: ContentDraftMedia["mediaKind"];
  size_bytes: number | null;
  sort_order: number;
  upload_status: ContentDraftMedia["uploadStatus"];
  metadata: Record<string, unknown> | null;
};

export function mapContentDraftRow(
  row: DraftRow,
  mediaRows: DraftMediaRow[] = []
): ContentDraft {
  return {
    id: row.id,
    ownerId: row.owner_id,
    draftType: row.draft_type,
    status: row.status,
    title: row.title,
    content: row.content,
    caption: row.caption,
    moods: row.moods ?? [],
    privacy: row.privacy,
    visibility: row.visibility,
    entryDate: row.entry_date,
    entryTimezone: row.entry_timezone,
    locationName: row.location_name,
    locationLabel: row.location_label,
    latitude: row.latitude,
    longitude: row.longitude,
    locationSource: row.location_source,
    locationConfidence: row.location_confidence,
    locationAccuracyMeters: row.location_accuracy_meters,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: mediaRows.map((media) => ({
      id: media.id,
      mediaAssetId: media.media_asset_id,
      objectKey: media.object_key,
      publicUrl: media.public_url,
      fileName: media.file_name,
      mimeType: media.mime_type,
      mediaKind: media.media_kind,
      sizeBytes: media.size_bytes,
      sortOrder: media.sort_order,
      uploadStatus: media.upload_status,
      metadata: media.metadata ?? {},
    })),
  };
}

export function mapHomeDraftRow(
  row: DraftRow & { content_draft_media?: Array<{ id: string }> | null }
): HomeDraft {
  return {
    id: row.id,
    draftType: row.draft_type,
    title: row.title,
    content: row.content,
    caption: row.caption,
    privacy: row.privacy,
    visibility: row.visibility,
    updatedAt: row.updated_at,
    mediaCount: row.content_draft_media?.length ?? 0,
  };
}
