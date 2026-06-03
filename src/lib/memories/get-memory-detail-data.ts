import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";
import { getMemoryEngagementMap } from "@/lib/memories/get-memory-engagements";
import type { FeedMemory, FeedMemoryMedia } from "@/types/memory";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type MemoryPrivacy = "private" | "followers" | "inner_circle" | "public" | "vault";

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

type ReflectionRow = {
  id: string;
  memory_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type MemoryReflection = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
  author: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
};

export type MemoryDetailData = {
  memory: FeedMemory;
  reflections: MemoryReflection[];
  viewer: {
    id: string;
    isOwner: boolean;
  };
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

async function canViewMemory({
  supabase,
  memory,
  viewerId,
}: {
  supabase: SupabaseClient;
  memory: MemoryRow;
  viewerId: string;
}) {
  if (memory.privacy === "vault") return false;
  if (memory.owner_id === viewerId) return true;
  if (memory.privacy === "public") return true;

  if (memory.privacy === "followers") {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", viewerId)
      .eq("following_id", memory.owner_id)
      .eq("status", "accepted")
      .maybeSingle();

    return Boolean(followRow);
  }

  return false;
}

export async function getMemoryDetailData({
  supabase,
  memoryId,
  viewerId,
}: {
  supabase: SupabaseClient;
  memoryId: string;
  viewerId: string;
}): Promise<MemoryDetailData> {
  const { data: memoryData, error: memoryError } = await supabase
    .from("memories")
    .select(
      "id, owner_id, title, content, mood, moods, privacy, location_name, tags, entry_date, created_at, updated_at"
    )
    .eq("id", memoryId)
    .maybeSingle();

  if (memoryError) {
    throw new Error(memoryError.message);
  }

  if (!memoryData) {
    notFound();
  }

  const memory = memoryData as MemoryRow;

  const allowed = await canViewMemory({
    supabase,
    memory,
    viewerId,
  });

  if (!allowed) {
    notFound();
  }

  const { data: authorProfileData } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .eq("id", memory.owner_id)
    .maybeSingle();

  const authorProfile = authorProfileData as PublicProfileRow | null;

  const authorAvatarUrl = await resolveAssetUrl(
    supabase,
    authorProfile?.avatar_asset_id ?? null,
    authorProfile?.avatar_url ?? null
  );

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

  const media: FeedMemoryMedia[] = [];

  for (const row of (memoryMediaRows ?? []) as MemoryMediaRow[]) {
    const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;

    if (!asset || asset.upload_status !== "uploaded") continue;

    let url = asset.public_url;

    if (!url && asset.object_key) {
      url = await createSignedReadUrl(asset.object_key);
    }

    if (!url) continue;

    media.push({
      id: asset.id,
      url,
      mimeType: asset.mime_type,
      mediaKind: asset.media_kind,
    });
  }

  const engagementMap = await getMemoryEngagementMap({
    supabase,
    memoryIds: [memory.id],
    viewerId,
  });

  const normalizedMoods =
    memory.moods && memory.moods.length > 0
      ? memory.moods
      : memory.mood
        ? [memory.mood]
        : [];

  const feedMemory: FeedMemory = {
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
      fullName: authorProfile?.full_name ?? "Memories User",
      username: authorProfile?.username ?? "memories_user",
      avatarUrl: authorAvatarUrl,
    },
    media,
    engagement: engagementMap.get(memory.id) ?? {
      likeCount: 0,
      reflectionCount: 0,
      viewerHasLiked: false,
      canEngage: memory.privacy !== "vault",
    },
  };

  const { data: reflectionRowsData, error: reflectionsError } = await supabase
    .from("memory_reflections")
    .select("id, memory_id, user_id, content, created_at, updated_at")
    .eq("memory_id", memory.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (reflectionsError) {
    throw new Error(reflectionsError.message);
  }

  const reflectionRows = (reflectionRowsData ?? []) as ReflectionRow[];

  if (reflectionRows.length === 0) {
    return {
      memory: feedMemory,
      reflections: [],
      viewer: {
        id: viewerId,
        isOwner: memory.owner_id === viewerId,
      },
    };
  }

  const reflectionAuthorIds = Array.from(
    new Set(reflectionRows.map((reflection) => reflection.user_id))
  );

  const { data: reflectionProfilesData } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .in("id", reflectionAuthorIds);

  const reflectionProfiles = (reflectionProfilesData ?? []) as PublicProfileRow[];

  const profileMap = new Map(
    reflectionProfiles.map((profile) => [profile.id, profile])
  );

  const reflections: MemoryReflection[] = [];

  for (const reflection of reflectionRows) {
    const profile = profileMap.get(reflection.user_id);

    const avatarUrl = await resolveAssetUrl(
      supabase,
      profile?.avatar_asset_id ?? null,
      profile?.avatar_url ?? null
    );

    reflections.push({
      id: reflection.id,
      content: reflection.content,
      createdAt: reflection.created_at,
      updatedAt: reflection.updated_at,
      canDelete:
        reflection.user_id === viewerId || memory.owner_id === viewerId,
      author: {
        id: reflection.user_id,
        fullName: profile?.full_name ?? "Memories User",
        username: profile?.username ?? "memories_user",
        avatarUrl,
      },
    });
  }

  return {
    memory: feedMemory,
    reflections,
    viewer: {
      id: viewerId,
      isOwner: memory.owner_id === viewerId,
    },
  };
}
