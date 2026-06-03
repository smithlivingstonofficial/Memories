import "server-only";

import { createSignedReadUrl } from "@/lib/r2";
import { getMemoryEngagementMap } from "@/lib/memories/get-memory-engagements";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type AccountVisibility = "public" | "private";

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
  account_visibility: AccountVisibility | null;
};

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

type ProfileSummaryRow = {
  memories_count: number;
  vault_count: number;
  media_count: number;
  followers_count: number;
  following_count: number;
  pending_requests_count: number;
  sent_requests_count: number;
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
    accountVisibility: AccountVisibility;
  };
  stats: {
    memories: number;
    vault: number;
    media: number;
    followers: number;
    following: number;
    pendingRequests: number;
    sentRequests: number;
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
    .from("profiles")
    .select(
      "id, username, full_name, bio, avatar_url, cover_url, avatar_asset_id, cover_asset_id, is_searchable, account_visibility"
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
    accountVisibility: profileRow?.account_visibility ?? "public",
  };

  const { data: profileSummaryRows, error: profileSummaryError } =
    await supabase.rpc("get_profile_summary", {
      target_user: userId,
    });

  let summaryRow = !profileSummaryError
    ? ((profileSummaryRows ?? [])[0] as ProfileSummaryRow | undefined)
    : undefined;

  if (!summaryRow) {
    const [
      memoriesResult,
      vaultResult,
      mediaResult,
      followersResult,
      followingResult,
      pendingRequestsResult,
      sentRequestsResult,
    ] = await Promise.all([
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .neq("privacy", "vault"),
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .eq("privacy", "vault"),
      supabase
        .from("media_assets")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .eq("upload_status", "uploaded"),
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
        .eq("status", "accepted"),
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId)
        .eq("status", "accepted"),
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
        .eq("status", "pending"),
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId)
        .eq("status", "pending"),
    ]);

    summaryRow = {
      memories_count: memoriesResult.count ?? 0,
      vault_count: vaultResult.count ?? 0,
      media_count: mediaResult.count ?? 0,
      followers_count: followersResult.count ?? 0,
      following_count: followingResult.count ?? 0,
      pending_requests_count: pendingRequestsResult.count ?? 0,
      sent_requests_count: sentRequestsResult.count ?? 0,
    };
  }

  const stats = {
    memories: Number(summaryRow.memories_count ?? 0),
    vault: Number(summaryRow.vault_count ?? 0),
    media: Number(summaryRow.media_count ?? 0),
    followers: Number(summaryRow.followers_count ?? 0),
    following: Number(summaryRow.following_count ?? 0),
    pendingRequests: Number(summaryRow.pending_requests_count ?? 0),
    sentRequests: Number(summaryRow.sent_requests_count ?? 0),
  };

  const { data: memories, error: memoriesError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, entry_date, created_at, updated_at"
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
      stats,
      memories: [],
    };
  }

  const memoryIds = memoryRows.map((memory) => memory.id);

  const engagementMap = await getMemoryEngagementMap({
    supabase,
    memoryIds,
    viewerId: userId,
  });

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
      entryDate: memory.entry_date,
      createdAt: memory.created_at,
      updatedAt: memory.updated_at,
      author: {
        id: userId,
        fullName: profile.fullName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      },
      media: mediaByMemoryId.get(memory.id) ?? [],
      engagement: engagementMap.get(memory.id) ?? {
        likeCount: 0,
        reflectionCount: 0,
        viewerHasLiked: false,
        canEngage: memory.privacy !== "vault",
      },
    };
  }) satisfies FeedMemory[];

  return {
    profile,
    stats,
    memories: feedMemories,
  };
}
