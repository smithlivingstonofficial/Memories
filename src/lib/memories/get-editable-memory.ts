import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type MemoryPrivacy = "private" | "inner_circle" | "friends" | "public" | "vault";

type MemoryRow = {
  id: string;
  owner_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  moods: string[] | null;
  privacy: MemoryPrivacy;
  location_name: string | null;
  tags: string[] | null;
  entry_date: string | null;
  entry_timezone: string | null;
  created_at: string;
};

type MediaAssetRow = {
  id: string;
  object_key: string;
  public_url: string | null;
  mime_type: string;
  media_kind: "image" | "video" | "audio" | "document";
  upload_status: string;
};

type MemoryMediaRow = {
  memory_id: string;
  sort_order: number;
  asset: MediaAssetRow | MediaAssetRow[] | null;
};

export type EditableMemoryMedia = {
  assetId: string;
  url: string;
  fileName: string;
  mimeType: string;
  mediaKind: "image" | "video" | "audio" | "document";
};

export type EditableMemory = {
  id: string;
  title: string;
  content: string;
  moods: string[];
  privacy: MemoryPrivacy;
  locationName: string;
  tags: string[];
  entryDate: string;
  entryTimezone: string;
  media: EditableMemoryMedia[];
};

export async function getEditableMemory({
  supabase,
  memoryId,
  viewerId,
  mode,
}: {
  supabase: SupabaseClient;
  memoryId: string;
  viewerId: string;
  mode: "memory" | "vault";
}): Promise<EditableMemory> {
  const { data: memoryData, error: memoryError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, entry_date, entry_timezone, created_at"
    )
    .eq("id", memoryId)
    .eq("owner_id", viewerId)
    .maybeSingle();

  if (memoryError) {
    throw new Error(memoryError.message);
  }

  if (!memoryData) {
    notFound();
  }

  const memory = memoryData as MemoryRow;

  if ((mode === "vault") !== (memory.privacy === "vault")) {
    notFound();
  }

  const { data: memoryMediaRows } = await supabase
    .from("memory_media")
    .select(
      `
      memory_id,
      sort_order,
      asset:media_assets (
        id,
        object_key,
        public_url,
        mime_type,
        media_kind,
        upload_status
      )
    `
    )
    .eq("memory_id", memory.id)
    .order("sort_order", { ascending: true });

  const media: EditableMemoryMedia[] = [];

  for (const row of (memoryMediaRows ?? []) as MemoryMediaRow[]) {
    const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;

    if (!asset || asset.upload_status !== "uploaded") continue;

    let url = asset.public_url;

    if (!url && asset.object_key) {
      url = await createSignedReadUrl(asset.object_key);
    }

    if (!url) continue;

    media.push({
      assetId: asset.id,
      url,
      fileName: asset.object_key.split("/").pop() || "Attached media",
      mimeType: asset.mime_type,
      mediaKind: asset.media_kind,
    });
  }

  const moods =
    memory.moods && memory.moods.length > 0
      ? memory.moods
      : memory.mood
        ? [memory.mood]
        : [];

  return {
    id: memory.id,
    title: memory.title ?? "",
    content: memory.content,
    moods,
    privacy: memory.privacy,
    locationName: memory.location_name ?? "",
    tags: memory.tags ?? [],
    entryDate: memory.entry_date ?? formatDateInput(memory.created_at),
    entryTimezone: memory.entry_timezone ?? "Asia/Kolkata",
    media,
  };
}

function formatDateInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "2026-01-01";
  }

  return date.toISOString().slice(0, 10);
}
