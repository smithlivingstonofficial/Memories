import "server-only";

import { createSignedReadUrl } from "@/lib/r2";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type FollowRequestRow = {
  id: string;
  follower_id: string;
  created_at: string;
};

type PublicProfileRow = {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  avatar_asset_id: string | null;
};

export type FollowRequestItem = {
  id: string;
  followerId: string;
  requestedAt: string;
  profile: {
    id: string;
    username: string;
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
};

export type FollowRequestsData = {
  stats: {
    pendingRequests: number;
    followers: number;
    following: number;
    sentRequests: number;
  };
  requests: FollowRequestItem[];
};

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

export async function getFollowRequestsData({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<FollowRequestsData> {
  const { count: pendingRequestsCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId)
    .eq("status", "pending");

  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId)
    .eq("status", "accepted");

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("status", "accepted");

  const { count: sentRequestsCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("status", "pending");

  const { data: requestRows, error: requestsError } = await supabase
    .from("user_follows")
    .select("id, follower_id, created_at")
    .eq("following_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (requestsError) {
    throw new Error(requestsError.message);
  }

  const requests = (requestRows ?? []) as FollowRequestRow[];

  if (requests.length === 0) {
    return {
      stats: {
        pendingRequests: pendingRequestsCount ?? 0,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
        sentRequests: sentRequestsCount ?? 0,
      },
      requests: [],
    };
  }

  const followerIds = requests.map((request) => request.follower_id);

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, username, full_name, bio, avatar_url, avatar_asset_id")
    .in("id", followerIds);

  const profileRows = (profiles ?? []) as PublicProfileRow[];

  const profileMap = new Map<string, PublicProfileRow>(
    profileRows.map((profile) => [profile.id, profile])
  );

  const mappedRequests: FollowRequestItem[] = [];

  for (const request of requests) {
    const profile = profileMap.get(request.follower_id);

    if (!profile) continue;

    const avatarUrl = await resolveAvatarUrl(
      supabase,
      profile.avatar_asset_id,
      profile.avatar_url
    );

    mappedRequests.push({
      id: request.id,
      followerId: request.follower_id,
      requestedAt: request.created_at,
      profile: {
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        bio: profile.bio,
        avatarUrl,
      },
    });
  }

  return {
    stats: {
      pendingRequests: pendingRequestsCount ?? 0,
      followers: followersCount ?? 0,
      following: followingCount ?? 0,
      sentRequests: sentRequestsCount ?? 0,
    },
    requests: mappedRequests,
  };
}
