import "server-only";

import { createSignedReadUrl } from "@/lib/r2";

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
  avatar_asset_id: string | null;
  account_visibility: AccountVisibility | null;
};

type FollowRow = {
  following_id: string;
  status: "pending" | "accepted" | "blocked";
};

export type DiscoverPerson = {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  accountVisibility: AccountVisibility;
  followStatus: FollowStatus;
};

export type DiscoverPeopleData = {
  query: string;
  people: DiscoverPerson[];
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

export async function getDiscoverPeopleData({
  supabase,
  userId,
  query,
}: {
  supabase: SupabaseClient;
  userId: string;
  query: string;
}): Promise<DiscoverPeopleData> {
  const cleanQuery = query
    .trim()
    .replace(/[,%]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60);

  let request = supabase
    .from("public_profiles")
    .select(
      "id, username, full_name, bio, avatar_url, avatar_asset_id, account_visibility"
    )
    .eq("is_searchable", true)
    .neq("id", userId)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (cleanQuery.length > 0) {
    const pattern = `%${cleanQuery}%`;

    request = request.or(
      `username.ilike.${pattern},full_name.ilike.${pattern},bio.ilike.${pattern}`
    );
  }

  const { data: profiles, error: profilesError } = await request;

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileRows = (profiles ?? []) as PublicProfileRow[];

  if (profileRows.length === 0) {
    return {
      query: cleanQuery,
      people: [],
    };
  }

  const profileIds = profileRows.map((profile) => profile.id);

  const { data: followRows } = await supabase
    .from("user_follows")
    .select("following_id, status")
    .eq("follower_id", userId)
    .in("following_id", profileIds);

  const followMap = new Map<string, FollowRow>(
    ((followRows ?? []) as FollowRow[]).map((row) => [row.following_id, row])
  );

  const people: DiscoverPerson[] = [];

  for (const profile of profileRows) {
    const followRow = followMap.get(profile.id);

    let followStatus: FollowStatus = "not_following";

    if (followRow?.status === "accepted") {
      followStatus = "following";
    } else if (followRow?.status === "pending") {
      followStatus = "requested";
    }

    const avatarUrl = await resolveAvatarUrl(
      supabase,
      profile.avatar_asset_id,
      profile.avatar_url
    );

    people.push({
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      bio: profile.bio,
      avatarUrl,
      accountVisibility: profile.account_visibility ?? "public",
      followStatus,
    });
  }

  return {
    query: cleanQuery,
    people,
  };
}