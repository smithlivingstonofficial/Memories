import "server-only";

import { createSignedReadUrl } from "@/lib/r2";
import { withQueryTimer, withTimer } from "@/lib/debug/performance-timer";
import { resolveAssetUrlMap } from "@/lib/media/resolve-asset-urls";
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

export async function getActiveMoments(
  supabase: SupabaseClient,
  viewerId: string
): Promise<ActiveMoment[]> {
  return withTimer("active-moments:total", async () => {
    const now = new Date().toISOString();

    const { data: moments, error: momentsError } = await withQueryTimer(
      "active-moments:query",
      supabase
        .from("moments")
        .select("id, owner_id, caption, mood, visibility, expires_at, created_at")
        .eq("is_archived", false)
        .eq("cleanup_status", "active")
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(12)
    );

    if (momentsError) {
      throw new Error(momentsError.message);
    }

    const momentRows = (moments ?? []) as MomentRow[];

    if (momentRows.length === 0) {
      return [];
    }

    const momentIds = momentRows.map((moment) => moment.id);
    const ownerIds = Array.from(
      new Set(momentRows.map((moment) => moment.owner_id))
    );

    const { data: profiles } = await withQueryTimer(
      "active-moments:profiles",
      supabase
        .from("public_profiles")
        .select("id, username, full_name, avatar_url, avatar_asset_id")
        .in("id", ownerIds)
    );

    const profileRows = (profiles ?? []) as PublicProfileRow[];

    const avatarUrlMap = await withTimer("active-moments:profiles", () =>
      resolveAssetUrlMap(
        supabase,
        profileRows.map((profile) => ({
          key: profile.id,
          assetId: profile.avatar_asset_id,
          fallbackUrl: profile.avatar_url,
        }))
      )
    );

    const profileMap = new Map<
      string,
      {
        id: string;
        username: string;
        fullName: string;
        avatarUrl: string | null;
      }
    >();

    for (const profile of profileRows) {
      profileMap.set(profile.id, {
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: avatarUrlMap.get(profile.id) ?? null,
      });
    }

    const { data: mediaRowsData } = await withQueryTimer(
      "active-moments:media",
      supabase
        .from("moment_media")
        .select(
          "id, moment_id, object_key, public_url, media_kind, mime_type, upload_status"
        )
        .in("moment_id", momentIds)
        .eq("upload_status", "uploaded")
        .order("display_order", { ascending: true })
    );

    const visibilityByMomentId = new Map(
      momentRows.map((moment) => [moment.id, moment.visibility])
    );
    const mediaRows = (mediaRowsData ?? []) as MomentMediaRow[];
    const mediaByMomentId = new Map<string, ActiveMomentMedia[]>();

    await withTimer("active-moments:signed-urls", async () => {
      await Promise.all(
        mediaRows.map(async (media) => {
          let url = media.public_url;

          if (
            !url &&
            visibilityByMomentId.get(media.moment_id) !== "public"
          ) {
            url = await createSignedReadUrl(media.object_key);
          }

          if (!url) return;

          const item: ActiveMomentMedia = {
            id: media.id,
            url,
            mimeType: media.mime_type,
            mediaKind: media.media_kind,
          };

          const existing = mediaByMomentId.get(media.moment_id) ?? [];
          existing.push(item);
          mediaByMomentId.set(media.moment_id, existing);
        })
      );
    });

    const activeMoments = momentRows.map((moment) => {
      const profile = profileMap.get(moment.owner_id);

      return {
        id: moment.id,
        ownerId: moment.owner_id,
        caption: moment.caption,
        mood: moment.mood,
        visibility: moment.visibility,
        expiresAt: moment.expires_at,
        createdAt: moment.created_at,
        author: {
          id: moment.owner_id,
          fullName: profile?.fullName ?? "Memories User",
          username: profile?.username ?? "memories_user",
          avatarUrl: profile?.avatarUrl ?? null,
        },
        media: mediaByMomentId.get(moment.id) ?? [],
      };
    });

    return activeMoments.sort((a, b) => {
      if (a.ownerId === viewerId && b.ownerId !== viewerId) return -1;
      if (a.ownerId !== viewerId && b.ownerId === viewerId) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });
}
