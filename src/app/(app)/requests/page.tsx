import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { FollowRequestsScreen } from "@/components/profile/follow-requests-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getFollowRequestsData } from "@/lib/follows/get-follow-requests-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function RequestsPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <RequestsContent />
    </Suspense>
  );
}

async function RequestsContent() {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getFollowRequestsData({
    supabase,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <FollowRequestsScreen data={data} />
    </AppLayout>
  );
}
