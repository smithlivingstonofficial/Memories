import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { CreateMomentScreen } from "@/components/create/create-moment-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { createClient } from "@/lib/supabase/server";
import { cacheTags } from "@/lib/cache-tags";
import { getContentDraftForCreate } from "@/lib/drafts/get-content-drafts";

export const unstable_instant = {
  prefetch: "static",
};

type CreateMomentPageProps = {
  searchParams?: Promise<{
    draftId?: string;
  }>;
};

export default function CreateMomentPage({
  searchParams,
}: CreateMomentPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateMomentContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CreateMomentContent({ searchParams }: CreateMomentPageProps) {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 180 });

  const params = await searchParams;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();
  cacheTag(cacheTags.userDrafts(appUser.id));

  const initialDraft = await getContentDraftForCreate({
    supabase,
    userId: appUser.id,
    draftId: params?.draftId,
    draftType: "moment",
  });

  return (
    <AppLayout user={appUser}>
      <CreateMomentScreen user={appUser} initialDraft={initialDraft} />
    </AppLayout>
  );
}
