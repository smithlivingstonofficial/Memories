import "server-only";

import { createSignedReadUrl } from "@/lib/r2";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type VaultMemoryRow = {
  id: string;
  owner_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  moods: string[] | null;
  privacy: "vault";
  location_name: string | null;
  tags: string[] | null;
  entry_date: string | null;
  created_at: string;
  updated_at: string;
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

export async function getVaultEntries(
  supabase: SupabaseClient,
  userId: string,
  author: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  }
): Promise<FeedMemory[]> {
  const { data: entries, error: entriesError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, entry_date, created_at, updated_at"
    )
    .eq("owner_id", userId)
    .eq("privacy", "vault")
    .order("created_at", { ascending: false })
    .limit(50);

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const entryRows = (entries ?? []) as VaultMemoryRow[];

  if (entryRows.length === 0) {
    return [];
  }

  const entryIds = entryRows.map((entry) => entry.id);

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
    .in("memory_id", entryIds)
    .order("sort_order", { ascending: true });

  const mediaByEntryId = new Map<string, FeedMemoryMedia[]>();

  for (const row of (memoryMediaRows ?? []) as MemoryMediaRow[]) {
    const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;

    if (!asset || asset.upload_status !== "uploaded") continue;

    let url = asset.public_url;

    if (!url && asset.object_key) {
      url = await createSignedReadUrl(asset.object_key);
    }

    if (!url) continue;

    const mediaItem: FeedMemoryMedia = {
      id: asset.id,
      url,
      mimeType: asset.mime_type,
      mediaKind: asset.media_kind,
    };

    const existing = mediaByEntryId.get(row.memory_id) ?? [];
    existing.push(mediaItem);
    mediaByEntryId.set(row.memory_id, existing);
  }

  return entryRows.map((entry) => {
    const normalizedMoods =
      entry.moods && entry.moods.length > 0
        ? entry.moods
        : entry.mood
          ? [entry.mood]
          : [];

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      moods: normalizedMoods,
      privacy: "vault",
      locationName: entry.location_name,
      tags: entry.tags ?? [],
      entryDate: entry.entry_date,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      author: {
        id: userId,
        fullName: author.fullName,
        username: author.username,
        avatarUrl: author.avatarUrl,
      },
      media: mediaByEntryId.get(entry.id) ?? [],
      engagement: {
        likeCount: 0,
        reflectionCount: 0,
        viewerHasLiked: false,
        canEngage: false,
      },
    };
  });
}
