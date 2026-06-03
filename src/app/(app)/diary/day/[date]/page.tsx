import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryDayScreen } from "@/components/diary/diary-day-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getDiaryDayPageData } from "@/lib/diary/get-diary-day-page-data";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { date: "2026-06-03" } }],
};

type DiaryDayPageProps = {
  params: Promise<{
    date: string;
  }>;
};

export default function DiaryDayPage({ params }: DiaryDayPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <DiaryDayContent params={params} />
    </Suspense>
  );
}

async function DiaryDayContent({ params }: DiaryDayPageProps) {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const { date } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userDiary(appUser.id));

  const data = await getDiaryDayPageData({
    supabase,
    date,
  });

  return (
    <AppLayout user={appUser}>
      <DiaryDayScreen data={data} />
    </AppLayout>
  );
}
