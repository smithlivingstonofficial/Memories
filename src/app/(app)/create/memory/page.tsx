import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { CreateMemoryScreen } from "@/components/create/create-memory-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { normalizeEntryDate } from "@/lib/diary/entry-date";
import { getContentDraftForCreate } from "@/lib/drafts/get-content-drafts";
import { getVaultAccessState } from "@/lib/vault/access";

export const unstable_instant = {
  prefetch: "static",
};

type CreateMemoryPageProps = {
  searchParams?: Promise<{
    date?: string;
    draft?: string;
    draftId?: string;
  }>;
};

export default function CreateMemoryPage({
  searchParams,
}: CreateMemoryPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateMemoryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CreateMemoryContent({ searchParams }: CreateMemoryPageProps) {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const params = await searchParams;
  const initialEntryDate = normalizeEntryDate(params?.date);
  const draftSource = params?.draft === "quick" ? "quick" : undefined;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userVault(appUser.id));
  cacheTag(cacheTags.userDrafts(appUser.id));

  const [vaultAccess, initialDraft] = await Promise.all([
    getVaultAccessState(supabase, appUser.id),
    getContentDraftForCreate({
      supabase,
      userId: appUser.id,
      draftId: params?.draftId,
      draftType: "memory",
    }),
  ]);

  return (
    <AppLayout user={appUser}>
      <CreateMemoryScreen
        initialEntryDate={initialEntryDate}
        draftSource={draftSource}
        initialDraft={initialDraft}
        vaultAccess={vaultAccess}
        user={appUser}
      />
    </AppLayout>
  );
}
