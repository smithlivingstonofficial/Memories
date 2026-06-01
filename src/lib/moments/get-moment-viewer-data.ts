import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";
import type { ActiveMoment, ActiveMomentMedia } from "@/types/moment";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type MomentRow = {
  id: string;
  owner_id: string;
  caption: string | null;
  mood: string | null;
  visibility: "public" | "followers" | "inner_circle" | "private";
  expires_at: string;
  created_at: string;
  is_archived: boolean;
};

type MomentMediaRow = {
  id: string;
  moment_id: string;
  object_key: string;
  public_url: string | null;
  media_kind: "image" | "video";
  mime_type: string | null;
  upload_status: string;
};

type PublicProfileRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  avatar_asset_id: string | null;
};

export type MomentViewerData = {
  moment: ActiveMoment;
  group: {
    ownerId: string;
    moments: ActiveMoment[];
    currentIndex: number;
    totalCount: number;
  };
  viewer: {
    id: string;
    isOwner: boolean;
    hasViewed: boolean;
  };
  stats: {
    viewCount: number | null;
  };
  navigation: {
    previousMomentId: string | null;
    nextMomentId: string | null;
  };
};

async function resolveObjectUrl(objectKey: string, publicUrl: string | null) {
  if (publicUrl) return publicUrl;
  return createSignedReadUrl(objectKey);
}

async function resolveAvatarUrl(
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

export async function getMomentViewerData({
  supabase,
  momentId,
  viewerId,
}: {
  supabase: SupabaseClient;
  momentId: string;
  viewerId: string;
}): Promise<MomentViewerData> {
  const now = new Date().toISOString();

  const { data: momentData, error: momentError } = await supabase
    .from("moments")
    .select(
      "id, owner_id, caption, mood, visibility, expires_at, created_at, is_archived"
    )
    .eq("id", momentId)
    .eq("is_archived", false)
    .eq("cleanup_status", "active")
    .gt("expires_at", now)
    .maybeSingle();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!momentData) {
    notFound();
  }

  const currentMomentRow = momentData as MomentRow;
  const isOwner = currentMomentRow.owner_id === viewerId;

  const { data: groupMomentsData, error: groupError } = await supabase
    .from("moments")
    .select(
      "id, owner_id, caption, mood, visibility, expires_at, created_at, is_archived"
    )
    .eq("owner_id", currentMomentRow.owner_id)
    .eq("is_archived", false)
    .eq("cleanup_status", "active")
    .gt("expires_at", now)
    .order("created_at", { ascending: true })
    .limit(30);

  if (groupError) {
    throw new Error(groupError.message);
  }

  const groupMomentRows = (groupMomentsData ?? []) as MomentRow[];

  if (groupMomentRows.length === 0) {
    notFound();
  }

  const momentIds = groupMomentRows.map((moment) => moment.id);

  const { data: profileData } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, avatar_asset_id")
    .eq("id", currentMomentRow.owner_id)
    .maybeSingle();

  const profile = profileData as PublicProfileRow | null;

  const avatarUrl = await resolveAvatarUrl(
    supabase,
    profile?.avatar_asset_id ?? null,
    profile?.avatar_url ?? null
  );

  const author = {
    id: currentMomentRow.owner_id,
    fullName: profile?.full_name ?? "Memories User",
    username: profile?.username ?? "memories_user",
    avatarUrl,
  };

  const { data: mediaRowsData, error: mediaError } = await supabase
    .from("moment_media")
    .select(
      "id, moment_id, object_key, public_url, media_kind, mime_type, upload_status"
    )
    .in("moment_id", momentIds)
    .eq("upload_status", "uploaded")
    .order("display_order", { ascending: true });

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  const mediaRows = (mediaRowsData ?? []) as MomentMediaRow[];
  const mediaByMomentId = new Map<string, ActiveMomentMedia[]>();

  for (const row of mediaRows) {
    const url = await resolveObjectUrl(row.object_key, row.public_url);

    const item: ActiveMomentMedia = {
      id: row.id,
      url,
      mimeType: row.mime_type,
      mediaKind: row.media_kind,
    };

    const existing = mediaByMomentId.get(row.moment_id) ?? [];
    existing.push(item);
    mediaByMomentId.set(row.moment_id, existing);
  }

  const groupMoments: ActiveMoment[] = groupMomentRows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    caption: row.caption,
    mood: row.mood,
    visibility: row.visibility,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    author,
    media: mediaByMomentId.get(row.id) ?? [],
  }));

  const currentIndex = groupMoments.findIndex(
    (moment) => moment.id === currentMomentRow.id
  );

  if (currentIndex === -1) {
    notFound();
  }

  const currentMoment = groupMoments[currentIndex];

  const { data: viewedRow } = await supabase
    .from("moment_views")
    .select("id")
    .eq("moment_id", currentMoment.id)
    .eq("viewer_id", viewerId)
    .maybeSingle();

  let viewCount: number | null = null;

  if (isOwner) {
    const { count } = await supabase
      .from("moment_views")
      .select("id", { count: "exact", head: true })
      .eq("moment_id", currentMoment.id);

    viewCount = count ?? 0;
  }

  return {
    moment: currentMoment,
    group: {
      ownerId: currentMoment.ownerId,
      moments: groupMoments,
      currentIndex,
      totalCount: groupMoments.length,
    },
    viewer: {
      id: viewerId,
      isOwner,
      hasViewed: Boolean(viewedRow),
    },
    stats: {
      viewCount,
    },
    navigation: {
      previousMomentId: groupMoments[currentIndex - 1]?.id ?? null,
      nextMomentId: groupMoments[currentIndex + 1]?.id ?? null,
    },
  };
}
