import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));

  const fallback = {
    fullName: appUser.fullName,
    username: appUser.username,
    avatarUrl: appUser.avatarUrl,
  };

  const data = await getProfilePageData({
    supabase,
    userId: appUser.id,
    fallbackProfile: fallback,
  });

  return (
    <AppLayout user={appUser}>
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
