import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { HomeScreen } from "@/components/home/home-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getHomeFeed } from "@/lib/memories/get-home-feed";
import { getActiveMoments } from "@/lib/moments/get-active-moments";

export const unstable_instant = {
  prefetch: "static",
};

export default function HomePage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userMemories(appUser.id));
  cacheTag(cacheTags.homeFeed(appUser.id));

  const [memories, activeMoments] = await Promise.all([
    getHomeFeed(supabase, appUser.id),
    getActiveMoments(supabase, appUser.id),
  ]);

  return (
    <AppLayout user={appUser}>
      <HomeScreen
        memories={memories}
        activeMoments={activeMoments}
        currentUserId={appUser.id}
      />
    </AppLayout>
  );
}
