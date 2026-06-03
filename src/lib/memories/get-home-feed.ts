import "server-only";

import { createSignedReadUrl } from "@/lib/r2";
import { getMemoryEngagementMap } from "@/lib/memories/get-memory-engagements";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type MemoryRow = {
  id: string;
  owner_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  moods: string[] | null;
  privacy: "private" | "followers" | "inner_circle" | "public" | "vault";
  location_name: string | null;
  tags: string[] | null;
  entry_date: string | null;
  created_at: string;
  updated_at: string;
};

type PublicProfileRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  avatar_asset_id: string | null;
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

async function resolveAssetUrl(
  supabase: SupabaseClient,
  assetId: string | null,
  fallbackUrl: string | null
) {
  if (fallbackUrl) return fallbackUrl;
  if (!assetId) return null;

  const { data: asset } = await supabase
    .from("media_assets")
    .select("object_key, public_url, upload_status")
    .eq("id", assetId)
    .eq("upload_status", "uploaded")
    .maybeSingle();

  if (!asset) return null;
  if (asset.public_url) return asset.public_url;

  if (asset.object_key) {
    return createSignedReadUrl(asset.object_key);
  }

  return null;
}

export async function getHomeFeed(
  supabase: SupabaseClient,
  viewerId: string
): Promise<FeedMemory[]> {
  const { data: memories, error: memoriesError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, entry_date, created_at, updated_at"
    )
    .neq("privacy", "vault")
    .order("created_at", { ascending: false })
    .limit(30);

  if (memoriesError) {
    throw new Error(memoriesError.message);
  }

  const memoryRows = (memories ?? []) as MemoryRow[];

  if (memoryRows.length === 0) {
    return [];
  }

  const memoryIds = memoryRows.map((memory) => memory.id);
  const ownerIds = Array.from(
    new Set(memoryRows.map((memory) => memory.owner_id))
  );

  const engagementMap = await getMemoryEngagementMap({
    supabase,
    memoryIds,
    viewerId,
  });

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .in("id", ownerIds);

  const profileMap = new Map<string, PublicProfileRow>();
  const avatarUrlMap = new Map<string, string | null>();

  for (const profile of (profiles ?? []) as PublicProfileRow[]) {
    profileMap.set(profile.id, profile);
    avatarUrlMap.set(
      profile.id,
      await resolveAssetUrl(supabase, profile.avatar_asset_id, profile.avatar_url)
    );
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
    .in("memory_id", memoryIds)
    .order("sort_order", { ascending: true });

  const mediaByMemoryId = new Map<string, FeedMemoryMedia[]>();

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

    const existing = mediaByMemoryId.get(row.memory_id) ?? [];
    existing.push(mediaItem);
    mediaByMemoryId.set(row.memory_id, existing);
  }

  return memoryRows.map((memory) => {
    const profile = profileMap.get(memory.owner_id);

    const normalizedMoods =
      memory.moods && memory.moods.length > 0
        ? memory.moods
        : memory.mood
          ? [memory.mood]
          : [];

    return {
      id: memory.id,
      title: memory.title,
      content: memory.content,
      mood: memory.mood,
      moods: normalizedMoods,
      privacy: memory.privacy,
      locationName: memory.location_name,
      tags: memory.tags ?? [],
      entryDate: memory.entry_date,
      createdAt: memory.created_at,
      updatedAt: memory.updated_at,
      author: {
        id: memory.owner_id,
        fullName: profile?.full_name ?? "Memories User",
        username: profile?.username ?? "memories_user",
        avatarUrl: avatarUrlMap.get(memory.owner_id) ?? null,
      },
      media: mediaByMemoryId.get(memory.id) ?? [],
      engagement: engagementMap.get(memory.id) ?? {
        likeCount: 0,
        reflectionCount: 0,
        viewerHasLiked: false,
        canEngage: memory.privacy !== "vault",
      },
    };
  });
}
