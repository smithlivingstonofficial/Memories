import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateVaultScreen } from "@/components/create/create-vault-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getVaultAccessState } from "@/lib/vault/access";

export default async function CreateVaultPage() {
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
