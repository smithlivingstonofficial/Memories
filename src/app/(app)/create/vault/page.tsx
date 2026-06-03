import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { CreateVaultScreen } from "@/components/create/create-vault-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getVaultAccessState } from "@/lib/vault/access";

export const unstable_instant = {
  prefetch: "static",
};

export default function CreateVaultPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateVaultContent />
    </Suspense>
  );
}

async function CreateVaultContent() {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userVault(appUser.id));

  const vaultAccess = await getVaultAccessState(supabase, appUser.id);

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
      <CreateVaultScreen />
    </AppLayout>
  );
}
