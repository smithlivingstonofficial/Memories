import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  const fullName = profile.full_name ?? "Memories User";
  const username = profile.username ?? "memories_user";
  const avatarUrl = profile.avatar_url ?? null;

  const data = await getProfilePageData({
    supabase,
    userId: user.id,
    fallbackProfile: {
      fullName,
      username,
      avatarUrl,
    },
  });

  return (
    <AppLayout
      user={{
        fullName: data.profile.fullName,
        username: data.profile.username,
        avatarUrl: data.profile.avatarUrl,
      }}
      >
      <ProfileScreen data={data} />
    </AppLayout>
  );
}