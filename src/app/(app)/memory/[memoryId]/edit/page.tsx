import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
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
  const appUser = await getAuthenticatedAppUser();

  const memory = await getEditableMemory({
    supabase,
    memoryId,
    viewerId: appUser.id,
    mode: "memory",
  });
  const vaultAccess = await getVaultAccessState(supabase, appUser.id);

  return (
    <AppLayout user={appUser}>
      <EditMemoryScreen memory={memory} mode="memory" vaultAccess={vaultAccess} />
    </AppLayout>
  );
}
