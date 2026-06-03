import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userMemories(appUser.id));
  cacheTag(cacheTags.userVault(appUser.id));

  const data = await getProfilePageData({
    supabase,
    userId: appUser.id,
    fallbackProfile: {
      fullName: appUser.fullName,
      username: appUser.username,
      avatarUrl: appUser.avatarUrl,
    },
  });

  return (
    <AppLayout user={appUser}>
      <ProfileScreen data={data} />
    </AppLayout>
  );
}
