import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: privateProfile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!privateProfile?.profile_completed || !privateProfile?.password_set) {
    redirect("/complete-profile");
  }

  const fallback = {
    fullName: privateProfile.full_name ?? "Memories User",
    username: privateProfile.username ?? "memories_user",
    avatarUrl: privateProfile.avatar_url ?? null,
  };

  const data = await getProfilePageData({
    supabase,
    userId: user.id,
    fallbackProfile: fallback,
  });

  return (
    <AppLayout
      user={{
        id: user.id,
        fullName: data.profile.fullName,
        username: data.profile.username,
        avatarUrl: data.profile.avatarUrl,
      }}
    >
      <SettingsScreen
        profile={{
          fullName: data.profile.fullName,
          username: data.profile.username,
          bio: data.profile.bio,
          accountVisibility: data.profile.accountVisibility,
          avatarUrl: data.profile.avatarUrl,
        }}
      />
    </AppLayout>
  );
}
