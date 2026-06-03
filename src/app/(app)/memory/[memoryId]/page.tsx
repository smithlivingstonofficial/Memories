import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MemoryDetailScreen } from "@/components/memory/memory-detail-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getMemoryDetailData } from "@/lib/memories/get-memory-detail-data";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { memoryId: "00000000-0000-4000-8000-000000000001" } }],
};

type MemoryDetailPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default function MemoryDetailPage({
  params,
}: MemoryDetailPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <MemoryDetailContent params={params} />
    </Suspense>
  );
}

async function MemoryDetailContent({ params }: MemoryDetailPageProps) {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const { memoryId } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.memory(memoryId));
  cacheTag(cacheTags.memoryEngagement(memoryId));

  const data = await getMemoryDetailData({
    supabase,
    memoryId,
    viewerId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MemoryDetailScreen data={data} />
    </AppLayout>
  );
}
