import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { VaultScreen } from "@/components/vault/vault-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getVaultEntries } from "@/lib/memories/get-vault-entries";
import { getVaultAccessState } from "@/lib/vault/access";

export default function VaultPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <VaultContent />
    </Suspense>
  );
}

async function VaultContent() {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });

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
          backHref="/home"
          backLabel="Back to Home"
        />
      </AppLayout>
    );
  }

  const entries = await getVaultEntries(supabase, appUser.id, {
    fullName: appUser.fullName,
    username: appUser.username,
    avatarUrl: appUser.avatarUrl,
  });

  return (
    <AppLayout user={appUser}>
      <VaultScreen entries={entries} />
    </AppLayout>
  );
}
