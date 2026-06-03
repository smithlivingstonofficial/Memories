import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { DiscoverPeopleScreen } from "@/components/discover/discover-people-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getDiscoverPeopleData } from "@/lib/discover/get-discover-people-data";

export const unstable_instant = {
  prefetch: "static",
};

type DiscoverPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <DiscoverContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DiscoverContent({ searchParams }: DiscoverPageProps) {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 180 });

  const params = await searchParams;
  const query = params.q ?? "";

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getDiscoverPeopleData({
    supabase,
    userId: appUser.id,
    query,
  });

  return (
    <AppLayout user={appUser}>
      <DiscoverPeopleScreen data={data} />
    </AppLayout>
  );
}
