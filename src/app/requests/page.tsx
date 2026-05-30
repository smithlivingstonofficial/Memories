import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { FollowRequestsScreen } from "@/components/profile/follow-requests-screen";
import { getFollowRequestsData } from "@/lib/follows/get-follow-requests-data";

export default async function RequestsPage() {
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

  const data = await getFollowRequestsData({
    supabase,
    userId: user.id,
  });

  return (
    <AppLayout
      user={{
        fullName: privateProfile.full_name ?? "Memories User",
        username: privateProfile.username ?? "memories_user",
        avatarUrl: privateProfile.avatar_url ?? null,
      }}
    >
      <FollowRequestsScreen data={data} />
    </AppLayout>
  );
}