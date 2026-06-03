import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { CreateVaultScreen } from "@/components/create/create-vault-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getContentDraftForCreate } from "@/lib/drafts/get-content-drafts";
import { getVaultAccessState } from "@/lib/vault/access";

export const unstable_instant = {
  prefetch: "static",
};

type CreateVaultPageProps = {
  searchParams?: Promise<{
    draftId?: string;
  }>;
};

export default function CreateVaultPage({ searchParams }: CreateVaultPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateVaultContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CreateVaultContent({ searchParams }: CreateVaultPageProps) {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const params = await searchParams;
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
      draftType: "vault",
    }),
  ]);

  if (!vaultAccess.isUnlocked) {
    return (
      <AppLayout user={appUser}>
        <VaultAccessScreen
          hasPasscode={vaultAccess.hasPasscode}
          title={
            vaultAccess.hasPasscode
              ? "Unlock before writing in Vault"
              : "Set a Vault PIN before writing"
          }
          backHref="/create"
          backLabel="Back to Create"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout user={appUser}>
      <CreateVaultScreen initialDraft={initialDraft} user={appUser} />
    </AppLayout>
  );
}
