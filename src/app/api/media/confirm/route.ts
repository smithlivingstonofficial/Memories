import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const assetId = String(body.assetId || "");

    if (!assetId) {
      return NextResponse.json(
        { message: "Missing asset id." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("media_assets")
      .update({
        upload_status: "uploaded",
      })
      .eq("id", assetId)
      .eq("owner_id", user.id)
      .select("id, object_key, public_url, upload_status")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      asset: data,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to confirm upload." },
      { status: 500 }
    );
  }
}