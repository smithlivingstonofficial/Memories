import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") ?? "").trim().toLowerCase();

  if (!isValidUsername(username)) {
    return NextResponse.json({
      available: false,
      message:
        "Use 3–24 characters. Lowercase letters, numbers, and underscore only.",
    });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        available: false,
        message: "Please login again.",
      },
      { status: 401 }
    );
  }

  const { data: existingProfile, error } = await supabase
    .from("public_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({
      available: false,
      message: error.message,
    });
  }

  if (existingProfile && existingProfile.id !== user.id) {
    return NextResponse.json({
      available: false,
      message: "This username is already taken.",
    });
  }

  return NextResponse.json({
    available: true,
    message: "Username is available.",
  });
}