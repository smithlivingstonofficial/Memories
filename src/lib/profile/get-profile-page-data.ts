import "server-only";

import { createSignedReadUrl } from "@/lib/r2";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type PublicProfileRow = {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  avatar_asset_id: string | null;
  cover_asset_id: string | null;
  is_searchable: boolean;
};

type MemoryRow = {
  id: string;
  owner_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  moods: string[] | null;
  privacy: "private" | "inner_circle" | "friends" | "public" | "vault";
  location_name: string | null;
  tags: string[] | null;
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

export type ProfilePageData = {
  profile: {
    id: string;
    username: string;
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    isSearchable: boolean;
  };
  stats: {
    memories: number;
    vault: number;
    media: number;
  };
  memories: FeedMemory[];
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

export async function getProfilePageData({
  supabase,
  userId,
  fallbackProfile,
}: {
  supabase: SupabaseClient;
  userId: string;
  fallbackProfile: {
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}): Promise<ProfilePageData> {
  const { data: publicProfile } = await supabase
    .from("public_profiles")
    .select(
      "id, username, full_name, bio, avatar_url, cover_url, avatar_asset_id, cover_asset_id, is_searchable"
    )
    .eq("id", userId)
    .maybeSingle();

  const profileRow = publicProfile as PublicProfileRow | null;

  const avatarUrl = await resolveAssetUrl(
    supabase,
    profileRow?.avatar_asset_id ?? null,
    profileRow?.avatar_url ?? fallbackProfile.avatarUrl
  );

  const coverUrl = await resolveAssetUrl(
    supabase,
    profileRow?.cover_asset_id ?? null,
    profileRow?.cover_url ?? null
  );

  const profile = {
    id: userId,
    username: profileRow?.username ?? fallbackProfile.username,
    fullName: profileRow?.full_name ?? fallbackProfile.fullName,
    bio: profileRow?.bio ?? null,
    avatarUrl,
    coverUrl,
    isSearchable: profileRow?.is_searchable ?? true,
  };

  const { count: memoriesCount } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .neq("privacy", "vault");

  const { count: vaultCount } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("privacy", "vault");

  const { count: mediaCount } = await supabase
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("upload_status", "uploaded");

  const { data: memories, error: memoriesError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, created_at"
    )
    .eq("owner_id", userId)
    .neq("privacy", "vault")
    .order("created_at", { ascending: false })
    .limit(24);

  if (memoriesError) {
    throw new Error(memoriesError.message);
  }

  const memoryRows = (memories ?? []) as MemoryRow[];

  if (memoryRows.length === 0) {
    return {
      profile,
      stats: {
        memories: memoriesCount ?? 0,
        vault: vaultCount ?? 0,
        media: mediaCount ?? 0,
      },
      memories: [],
    };
  }

  const memoryIds = memoryRows.map((memory) => memory.id);

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

  const feedMemories = memoryRows.map((memory) => {
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
      createdAt: memory.created_at,
      author: {
        id: userId,
        fullName: profile.fullName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      },
      media: mediaByMemoryId.get(memory.id) ?? [],
    };
  }) satisfies FeedMemory[];

  return {
    profile,
    stats: {
      memories: memoriesCount ?? 0,
      vault: vaultCount ?? 0,
      media: mediaCount ?? 0,
    },
    memories: feedMemories,
  };
}