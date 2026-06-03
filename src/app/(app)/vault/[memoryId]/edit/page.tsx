import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getEditableMemory } from "@/lib/memories/get-editable-memory";
import { getVaultAccessState } from "@/lib/vault/access";

type EditVaultEntryPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default async function EditVaultEntryPage({
  params,
}: EditVaultEntryPageProps) {
  const { memoryId } = await params;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

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
