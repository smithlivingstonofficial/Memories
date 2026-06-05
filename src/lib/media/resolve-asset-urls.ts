import "server-only";

import { createSignedReadUrl } from "@/lib/r2";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type AssetUrlInput = {
  key: string;
  assetId: string | null;
  fallbackUrl: string | null;
};

type MediaAssetRow = {
  id: string;
  object_key: string | null;
  public_url: string | null;
};

export async function resolveAssetUrlMap(
  supabase: SupabaseClient,
  inputs: AssetUrlInput[]
) {
  const urlMap = new Map<string, string | null>();
  const assetIds = new Set<string>();

  for (const input of inputs) {
    if (input.fallbackUrl) {
      urlMap.set(input.key, input.fallbackUrl);
    } else if (input.assetId) {
      assetIds.add(input.assetId);
    } else {
      urlMap.set(input.key, null);
    }
  }

  if (assetIds.size === 0) {
    return urlMap;
  }

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, object_key, public_url")
    .in("id", Array.from(assetIds))
    .eq("upload_status", "uploaded");

  const assetMap = new Map<string, MediaAssetRow>(
    ((assets ?? []) as MediaAssetRow[]).map((asset) => [asset.id, asset])
  );

  await Promise.all(
    inputs.map(async (input) => {
      if (urlMap.has(input.key)) return;

      if (!input.assetId) {
        urlMap.set(input.key, null);
        return;
      }

      const asset = assetMap.get(input.assetId);

      if (!asset) {
        urlMap.set(input.key, null);
        return;
      }

      if (asset.public_url) {
        urlMap.set(input.key, asset.public_url);
        return;
      }

      if (asset.object_key) {
        urlMap.set(input.key, await createSignedReadUrl(asset.object_key));
        return;
      }

      urlMap.set(input.key, null);
    })
  );

  return urlMap;
}
