import "server-only";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export type MemoryEngagementData = {
  likeCount: number;
  reflectionCount: number;
  viewerHasLiked: boolean;
  canEngage: boolean;
};

type EngagementSummaryRow = {
  memory_id: string;
  like_count: number;
  reflection_count: number;
  viewer_has_liked: boolean;
};

export async function getMemoryEngagementMap({
  supabase,
  memoryIds,
  viewerId,
}: {
  supabase: SupabaseClient;
  memoryIds: string[];
  viewerId: string;
}) {
  const map = new Map<string, MemoryEngagementData>();

  for (const memoryId of memoryIds) {
    map.set(memoryId, {
      likeCount: 0,
      reflectionCount: 0,
      viewerHasLiked: false,
      canEngage: true,
    });
  }

  if (memoryIds.length === 0) return map;

  const { data: summaryRows, error: summaryError } = await supabase.rpc(
    "get_memory_engagement_summary",
    {
      memory_ids: memoryIds,
      viewer: viewerId,
    }
  );

  if (!summaryError && summaryRows) {
    for (const row of summaryRows as EngagementSummaryRow[]) {
      const existing = map.get(row.memory_id);

      if (!existing) continue;

      existing.likeCount = Number(row.like_count ?? 0);
      existing.reflectionCount = Number(row.reflection_count ?? 0);
      existing.viewerHasLiked = Boolean(row.viewer_has_liked);
    }

    return map;
  }

  if (summaryError && process.env.NODE_ENV !== "production") {
    console.warn(
      `[QueryTimer] get_memory_engagement_summary failed; using fallback engagement queries: ${summaryError.message}`
    );
  }

  const { data: likes } = await supabase
    .from("memory_likes")
    .select("memory_id, user_id")
    .in("memory_id", memoryIds);

  for (const like of likes ?? []) {
    const existing = map.get(like.memory_id);

    if (!existing) continue;

    existing.likeCount += 1;

    if (like.user_id === viewerId) {
      existing.viewerHasLiked = true;
    }
  }

  const { data: reflections } = await supabase
    .from("memory_reflections")
    .select("memory_id")
    .in("memory_id", memoryIds);

  for (const reflection of reflections ?? []) {
    const existing = map.get(reflection.memory_id);

    if (!existing) continue;

    existing.reflectionCount += 1;
  }

  return map;
}
