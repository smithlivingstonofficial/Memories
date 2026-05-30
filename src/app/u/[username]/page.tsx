import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { PublicProfileScreen } from "@/components/profile/public-profile-screen";
import { getPublicProfilePageData } from "@/lib/profile/get-public-profile-page-data";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

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

  const data = await getPublicProfilePageData({
    supabase,
    username,
    viewerId: user.id,
  });

  return (
    <AppLayout
      user={{
        fullName: privateProfile.full_name ?? "Memories User",
        username: privateProfile.username ?? "memories_user",
        avatarUrl: privateProfile.avatar_url ?? null,
      }}
    >
      <PublicProfileScreen data={data} />
    </AppLayout>
  );
}