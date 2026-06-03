export type ContentDraftType = "memory" | "vault" | "moment";
export type ContentDraftStatus = "active" | "published" | "discarded";

export type ContentDraftMedia = {
  id?: string;
  mediaAssetId?: string | null;
  objectKey?: string | null;
  publicUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  mediaKind?: "image" | "video" | "audio" | "document" | null;
  sizeBytes?: number | null;
  sortOrder?: number;
  uploadStatus?: "pending" | "uploaded" | "deleted" | "failed";
  metadata?: Record<string, unknown>;
};

export type ContentDraftPayload = {
  id?: string;
  draftType: ContentDraftType;
  title?: string | null;
  content?: string | null;
  caption?: string | null;
  moods?: string[];
  privacy?: string | null;
  visibility?: string | null;
  entryDate?: string | null;
  entryTimezone?: string | null;
  locationName?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: string | null;
  locationConfidence?: number | null;
  locationAccuracyMeters?: number | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  media?: ContentDraftMedia[];
};

export type ContentDraft = ContentDraftPayload & {
  id: string;
  ownerId: string;
  status: ContentDraftStatus;
  updatedAt: string;
  createdAt: string;
  media: ContentDraftMedia[];
};

export type HomeDraft = {
  id: string;
  draftType: ContentDraftType;
  title: string | null;
  content: string | null;
  caption: string | null;
  privacy: string | null;
  visibility: string | null;
  updatedAt: string;
  mediaCount: number;
};
