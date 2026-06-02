import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateVaultScreen } from "@/components/create/create-vault-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
import { getVaultAccessState } from "@/lib/vault/access";

export default async function CreateVaultPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  const vaultAccess = await getVaultAccessState(supabase, user.id);

  if (!vaultAccess.isUnlocked) {
    return (
      <AppLayout
        user={{
          fullName: profile.full_name ?? "Memories User",
          username: profile.username ?? "memories_user",
          avatarUrl: profile.avatar_url,
        }}
      >
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
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url,
      }}
    >
      <CreateVaultScreen />
    </AppLayout>
  );
}
