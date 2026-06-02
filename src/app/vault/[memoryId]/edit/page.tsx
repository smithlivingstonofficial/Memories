import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { VaultAccessScreen } from "@/components/vault/vault-access-screen";
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
          avatarUrl: profile.avatar_url ?? null,
        }}
      >
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
    viewerId: user.id,
    mode: "vault",
  });

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <EditMemoryScreen memory={memory} mode="vault" vaultAccess={vaultAccess} />
    </AppLayout>
  );
}
