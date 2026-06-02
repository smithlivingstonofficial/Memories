import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";
import { getMemoryEngagementMap } from "@/lib/memories/get-memory-engagements";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type AccountVisibility = "public" | "private";

type FollowStatus = "self" | "not_following" | "requested" | "following";

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

type FollowRow = {
  status: "pending" | "accepted" | "blocked";
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

export type PublicProfilePageData = {
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
  viewer: {
    id: string;
    isOwner: boolean;
    followStatus: FollowStatus;
    canViewProfileMemories: boolean;
  };
  stats: {
    publicMemories: number;
    publicMedia: number;
    followers: number;
    following: number;
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

export async function getPublicProfilePageData({
  supabase,
  username,
  viewerId,
}: {
  supabase: SupabaseClient;
  username: string;
  viewerId: string;
}): Promise<PublicProfilePageData> {
  const cleanUsername = username.trim().toLowerCase();

  const { data: publicProfile, error: profileError } = await supabase
    .from("public_profiles")
    .select(
      "id, username, full_name, bio, avatar_url, cover_url, avatar_asset_id, cover_asset_id, is_searchable, account_visibility"
    )
    .eq("username", cleanUsername)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!publicProfile) {
    notFound();
  }

  const profileRow = publicProfile as PublicProfileRow;

  const avatarUrl = await resolveAssetUrl(
    supabase,
    profileRow.avatar_asset_id,
    profileRow.avatar_url
  );

  const coverUrl = await resolveAssetUrl(
    supabase,
    profileRow.cover_asset_id,
    profileRow.cover_url
  );

  const isOwner = profileRow.id === viewerId;

  const profile = {
    id: profileRow.id,
    username: profileRow.username,
    fullName: profileRow.full_name,
    bio: profileRow.bio,
    avatarUrl,
    coverUrl,
    isSearchable: profileRow.is_searchable,
    accountVisibility: profileRow.account_visibility ?? "public",
  };

  let followStatus: FollowStatus = isOwner ? "self" : "not_following";

  if (!isOwner) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("status")
      .eq("follower_id", viewerId)
      .eq("following_id", profile.id)
      .maybeSingle();

    const typedFollowRow = followRow as FollowRow | null;

    if (typedFollowRow?.status === "accepted") {
      followStatus = "following";
    } else if (typedFollowRow?.status === "pending") {
      followStatus = "requested";
    }
  }

  const canViewProfileMemories =
    isOwner ||
    profile.accountVisibility === "public" ||
    followStatus === "following";

  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", profile.id)
    .eq("status", "accepted");

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", profile.id)
    .eq("status", "accepted");

  const socialStats = {
    followers: followersCount ?? 0,
    following: followingCount ?? 0,
  };

  if (!canViewProfileMemories) {
    return {
      profile,
      viewer: {
        id: viewerId,
        isOwner,
        followStatus,
        canViewProfileMemories,
      },
      stats: {
        publicMemories: 0,
        publicMedia: 0,
        followers: socialStats.followers,
        following: socialStats.following,
      },
      memories: [],
    };
  }

  const { count: publicMemoriesCount } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", profile.id)
    .eq("privacy", "public");

  const { data: publicMemories, error: memoriesError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, created_at"
    )
    .eq("owner_id", profile.id)
    .eq("privacy", "public")
    .order("created_at", { ascending: false })
    .limit(24);

  if (memoriesError) {
    throw new Error(memoriesError.message);
  }

  const memoryRows = (publicMemories ?? []) as MemoryRow[];

  if (memoryRows.length === 0) {
    return {
      profile,
      viewer: {
        id: viewerId,
        isOwner,
        followStatus,
        canViewProfileMemories,
      },
      stats: {
        publicMemories: publicMemoriesCount ?? 0,
        publicMedia: 0,
        followers: socialStats.followers,
        following: socialStats.following,
      },
      memories: [],
    };
  }

  const memoryIds = memoryRows.map((memory) => memory.id);

  const engagementMap = await getMemoryEngagementMap({
    supabase,
    memoryIds,
    viewerId,
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
      createdAt: memory.created_at,
      author: {
        id: profile.id,
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

  const publicMediaCount = feedMemories.reduce(
    (total, memory) => total + memory.media.length,
    0
  );

  return {
    profile,
    viewer: {
      id: viewerId,
      isOwner,
      followStatus,
      canViewProfileMemories,
    },
    stats: {
      publicMemories: publicMemoriesCount ?? 0,
      publicMedia: publicMediaCount,
      followers: socialStats.followers,
      following: socialStats.following,
    },
    memories: feedMemories,
  };
}
