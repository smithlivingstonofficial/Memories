import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { AppLayout } from "@/components/layout/app-layout";
import { MemoryMapDynamic } from "@/components/map/memory-map-dynamic";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getMemoryMapData } from "@/lib/map/get-memory-map-data";
import { createClient } from "@/lib/supabase/server";

export const unstable_instant = {
  prefetch: "static",
};

export default function MemoryMapPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <MemoryMapContent />
    </Suspense>
  );
}

async function MemoryMapContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userMemories(appUser.id));

  const memories = await getMemoryMapData({
    supabase,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MemoryMapDynamic memories={memories} />
    </AppLayout>
  );
}
