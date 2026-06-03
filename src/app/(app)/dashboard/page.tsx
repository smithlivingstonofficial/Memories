import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryDashboardScreen } from "@/components/diary/diary-dashboard-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getDiaryDashboardData } from "@/lib/diary/get-diary-dashboard-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userDiary(appUser.id));

  const dashboardData = await getDiaryDashboardData(supabase);

  return (
    <AppLayout user={appUser}>
      <DiaryDashboardScreen data={dashboardData} />
    </AppLayout>
  );
}
