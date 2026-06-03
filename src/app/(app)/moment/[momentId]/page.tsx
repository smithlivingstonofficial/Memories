import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { MomentViewerScreen } from "@/components/moments/moment-viewer-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMomentViewerData } from "@/lib/moments/get-moment-viewer-data";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { momentId: "00000000-0000-4000-8000-000000000001" } }],
};

type MomentViewerPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default function MomentViewerPage({
  params,
}: MomentViewerPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <MomentViewerContent params={params} />
    </Suspense>
  );
}

async function MomentViewerContent({ params }: MomentViewerPageProps) {
  "use cache: private";
  cacheLife({ stale: 10, revalidate: 20, expire: 120 });

  const { momentId } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getMomentViewerData({
    supabase,
    momentId,
    viewerId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MomentViewerScreen data={data} />
    </AppLayout>
  );
}
