import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaAssetsCompletely } from "@/lib/media/delete-media";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { message: "Unauthorized request." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const assetIds: unknown[] = Array.isArray(body.assetIds)
      ? body.assetIds
      : [body.assetId];
    const normalizedAssetIds = assetIds
      .filter((assetId): assetId is string => typeof assetId === "string")
      .map((assetId) => assetId.trim())
      .filter(Boolean);

    if (normalizedAssetIds.length === 0) {
      return NextResponse.json(
        { message: "Missing asset id." },
        { status: 400 }
      );
    }

    const result = await deleteMediaAssetsCompletely({
      supabase,
      userId: user.id,
      assetIds: normalizedAssetIds,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Unable to delete uploaded media." },
      { status: 500 }
    );
  }
}
