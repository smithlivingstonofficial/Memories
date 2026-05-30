// src/app/complete-profile/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileScreen } from "@/components/auth/complete-profile-screen";

export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, full_name, mobile_number, avatar_url, profile_completed, password_set"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.profile_completed && profile?.password_set) {
    redirect("/home");
  }

  return (
    <CompleteProfileScreen
      email={user.email ?? ""}
      initialProfile={{
        username: profile?.username ?? "",
        fullName:
          profile?.full_name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
        mobileNumber: profile?.mobile_number ?? "",
        avatarUrl:
          profile?.avatar_url ??
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          "",
      }}
    />
  );
}