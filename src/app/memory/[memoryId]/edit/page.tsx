import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { getEditableMemory } from "@/lib/memories/get-editable-memory";
import { getVaultAccessState } from "@/lib/vault/access";

type EditMemoryPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default async function EditMemoryPage({ params }: EditMemoryPageProps) {
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

  const memory = await getEditableMemory({
    supabase,
    memoryId,
    viewerId: user.id,
    mode: "memory",
  });
  const vaultAccess = await getVaultAccessState(supabase, user.id);

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <EditMemoryScreen memory={memory} mode="memory" vaultAccess={vaultAccess} />
    </AppLayout>
  );
}
