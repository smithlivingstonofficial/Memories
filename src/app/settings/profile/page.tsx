import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditProfileScreen } from "@/components/profile/edit-profile-screen";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export default async function EditProfilePage() {
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
        fullName: data.profile.fullName,
        username: data.profile.username,
        avatarUrl: data.profile.avatarUrl,
      }}
    >
      <EditProfileScreen
        initialProfile={{
          fullName: data.profile.fullName,
          username: data.profile.username,
          bio: data.profile.bio,
          avatarUrl: data.profile.avatarUrl,
          coverUrl: data.profile.coverUrl,
        }}
      />
    </AppLayout>
  );
}