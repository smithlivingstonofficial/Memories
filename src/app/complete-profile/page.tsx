import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileScreen } from "@/components/auth/complete-profile-screen";

type IncompleteProfile = {
  username: string | null;
  full_name: string | null;
  mobile_country_code: string | null;
  mobile_number: string | null;
  date_of_birth: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_completed: boolean | null;
  password_set: boolean | null;
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: IncompleteProfile | null = null;

  try {
    const { data } = await supabase
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

    profile = data as IncompleteProfile | null;
  } catch {
    profile = null;
  }

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
