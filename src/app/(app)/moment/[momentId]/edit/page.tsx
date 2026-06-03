import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { EditMomentScreen } from "@/components/moments/edit-moment-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getEditableMoment } from "@/lib/moments/get-editable-moment";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { momentId: "00000000-0000-4000-8000-000000000001" } }],
};

type EditMomentPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default function EditMomentPage({ params }: EditMomentPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <EditMomentContent params={params} />
    </Suspense>
  );
}

async function EditMomentContent({ params }: EditMomentPageProps) {
  "use cache: private";
  cacheLife({ stale: 15, revalidate: 30, expire: 120 });

  const { momentId } = await params;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const moment = await getEditableMoment({
    supabase,
    momentId,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <EditMomentScreen moment={moment} />
    </AppLayout>
  );
}
