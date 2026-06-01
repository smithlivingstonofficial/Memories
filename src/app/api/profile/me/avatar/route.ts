import { NextResponse } from "next/server";
import { createSignedReadUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ avatarUrl: null }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, avatar_asset_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ avatarUrl: null });
  }

  if (profile.avatar_url) {
    return NextResponse.json({ avatarUrl: profile.avatar_url });
  }

  if (!profile.avatar_asset_id) {
    return NextResponse.json({ avatarUrl: null });
  }

  const { data: asset } = await supabase
    .from("media_assets")
    .select("object_key, public_url, upload_status")
    .eq("id", profile.avatar_asset_id)
    .eq("upload_status", "uploaded")
    .maybeSingle();

  if (!asset) {
    return NextResponse.json({ avatarUrl: null });
  }

  if (asset.public_url) {
    return NextResponse.json({ avatarUrl: asset.public_url });
  }

  if (asset.object_key) {
    return NextResponse.json({
      avatarUrl: await createSignedReadUrl(asset.object_key),
    });
  }

  return NextResponse.json({ avatarUrl: null });
}
