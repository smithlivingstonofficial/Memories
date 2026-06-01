import "server-only";

import { deleteR2Object } from "@/lib/r2-delete";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type MediaAssetRow = {
  id: string;
  object_key: string;
};

export async function deleteMediaAssetsCompletely({
  supabase,
  userId,
  assetIds,
}: {
  supabase: SupabaseClient;
  userId: string;
  assetIds: string[];
}) {
  const uniqueAssetIds = Array.from(new Set(assetIds)).filter(Boolean);

  if (uniqueAssetIds.length === 0) {
    return {
      deleted: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const { data: assets, error } = await supabase
    .from("media_assets")
    .select("id, object_key")
    .eq("owner_id", userId)
    .in("id", uniqueAssetIds);

  if (error) {
    throw new Error(error.message);
  }

  const assetRows = (assets ?? []) as MediaAssetRow[];

  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const asset of assetRows) {
    const { count: memoryRefs } = await supabase
      .from("memory_media")
      .select("id", { count: "exact", head: true })
      .eq("asset_id", asset.id);

    const { data: profileRefs } = await supabase
      .from("profiles")
      .select("id")
      .or(`avatar_asset_id.eq.${asset.id},cover_asset_id.eq.${asset.id}`)
      .limit(1);

    const stillUsed =
      (memoryRefs ?? 0) > 0 || ((profileRefs ?? []).length > 0);

    if (stillUsed) {
      skipped += 1;
      continue;
    }

    try {
      await deleteR2Object(asset.object_key);

      const { error: deleteDbError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", asset.id)
        .eq("owner_id", userId);

      if (deleteDbError) {
        throw new Error(deleteDbError.message);
      }

      deleted += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    deleted,
    skipped,
    failed,
  };
}