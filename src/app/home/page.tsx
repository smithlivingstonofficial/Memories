import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { HomeScreen } from "@/components/home/home-screen";
import { getHomeFeed } from "@/lib/memories/get-home-feed";
import { getActiveMoments } from "@/lib/moments/get-active-moments";

export default async function HomePage() {
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

  const [memories, activeMoments] = await Promise.all([
    getHomeFeed(supabase, user.id),
    getActiveMoments(supabase, user.id),
  ]);

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <HomeScreen
        memories={memories}
        activeMoments={activeMoments}
        currentUserId={user.id}
      />
    </AppLayout>
  );
}