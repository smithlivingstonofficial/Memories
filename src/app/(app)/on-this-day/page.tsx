import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { OnThisDayScreen } from "@/components/diary/on-this-day-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getOnThisDayPageData } from "@/lib/diary/get-on-this-day-page-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function OnThisDayPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <OnThisDayContent />
    </Suspense>
  );
}

async function OnThisDayContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userDiary(appUser.id));

  const data = await getOnThisDayPageData(supabase);

  return (
    <AppLayout user={appUser}>
      <OnThisDayScreen data={data} />
    </AppLayout>
  );
}
