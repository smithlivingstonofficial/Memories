import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getEditableMemory } from "@/lib/memories/get-editable-memory";
import { getVaultAccessState } from "@/lib/vault/access";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { memoryId: "00000000-0000-4000-8000-000000000001" } }],
};

type EditVaultEntryPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default function EditVaultEntryPage({
  params,
}: EditVaultEntryPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <EditVaultEntryContent params={params} />
    </Suspense>
  );
}

async function EditVaultEntryContent({ params }: EditVaultEntryPageProps) {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const { memoryId } = await params;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userVault(appUser.id));
  cacheTag(cacheTags.memory(memoryId));

  const vaultAccess = await getVaultAccessState(supabase, appUser.id);

  if (!vaultAccess.isUnlocked) {
    return (
      <AppLayout user={appUser}>
        <VaultAccessScreen
          hasPasscode={vaultAccess.hasPasscode}
          title={
            vaultAccess.hasPasscode
              ? "Unlock before editing Vault"
              : "Set a Vault PIN before editing"
          }
          backHref="/vault"
          backLabel="Back to Vault"
        />
      </AppLayout>
    );
  }

  const memory = await getEditableMemory({
    supabase,
    memoryId,
    viewerId: appUser.id,
    mode: "vault",
  });

  return (
    <AppLayout user={appUser}>
      <EditMemoryScreen memory={memory} mode="vault" vaultAccess={vaultAccess} />
    </AppLayout>
  );
}
