import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { PublicProfileScreen } from "@/components/profile/public-profile-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getPublicProfilePageData } from "@/lib/profile/get-public-profile-page-data";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { username: "sampleuser" } }],
};

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <PublicProfileContent params={params} />
    </Suspense>
  );
}

async function PublicProfileContent({ params }: PublicProfilePageProps) {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 240 });

  const { username } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getPublicProfilePageData({
    supabase,
    username,
    viewerId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <PublicProfileScreen data={data} />
    </AppLayout>
  );
}
