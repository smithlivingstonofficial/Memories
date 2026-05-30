import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { VaultScreen } from "@/components/vault/vault-screen";
import { getVaultEntries } from "@/lib/memories/get-vault-entries";

export default async function VaultPage() {
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

  const fullName = profile.full_name ?? "Memories User";
  const username = profile.username ?? "memories_user";
  const avatarUrl = profile.avatar_url ?? null;

  const entries = await getVaultEntries(supabase, user.id, {
    fullName,
    username,
    avatarUrl,
  });

  return (
    <AppLayout
      user={{
        fullName,
        username,
        avatarUrl,
      }}
    >
      <VaultScreen entries={entries} />
    </AppLayout>
  );
}