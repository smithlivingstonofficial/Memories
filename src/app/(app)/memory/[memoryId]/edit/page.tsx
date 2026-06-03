import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { EditMemoryScreen } from "@/components/memory/edit-memory-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getEditableMemory } from "@/lib/memories/get-editable-memory";
import { getVaultAccessState } from "@/lib/vault/access";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { memoryId: "00000000-0000-4000-8000-000000000001" } }],
};

type EditMemoryPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default function EditMemoryPage({ params }: EditMemoryPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <EditMemoryContent params={params} />
    </Suspense>
  );
}

async function EditMemoryContent({ params }: EditMemoryPageProps) {
  "use cache: private";
  cacheLife({ stale: 20, revalidate: 45, expire: 180 });

  const { memoryId } = await params;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.memory(memoryId));
  cacheTag(cacheTags.userVault(appUser.id));

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
