import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { DiaryTimelineScreen } from "@/components/diary/diary-timeline-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getDiaryTimelinePageData } from "@/lib/diary/get-diary-timeline-page-data";

export const unstable_instant = {
  prefetch: "static",
};

type TimelinePageProps = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    month?: string;
    mood?: string;
    tag?: string;
  }>;
};

export default function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <TimelineContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TimelineContent({ searchParams }: TimelinePageProps) {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const params = await searchParams;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userDiary(appUser.id));

  const data = await getDiaryTimelinePageData({
    supabase,
    q: params?.q,
    type: params?.type,
    month: params?.month,
    mood: params?.mood,
    tag: params?.tag,
  });

  return (
    <AppLayout user={appUser}>
      <DiaryTimelineScreen data={data} />
    </AppLayout>
  );
}
