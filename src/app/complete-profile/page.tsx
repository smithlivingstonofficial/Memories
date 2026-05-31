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
      `
      username,
      full_name,
      mobile_country_code,
      mobile_number,
      date_of_birth,
      bio,
      avatar_url,
      profile_completed,
      password_set
    `
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
        mobileCountryCode: profile?.mobile_country_code ?? "+91",
        mobileNumber: profile?.mobile_number ?? "",
        dateOfBirth: profile?.date_of_birth ?? "",
        bio: profile?.bio ?? "",
        avatarUrl:
          profile?.avatar_url ??
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          "",
      }}
    />
  );
}