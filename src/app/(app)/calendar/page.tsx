import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryCalendarScreen } from "@/components/diary/diary-calendar-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";
import { getDiaryCalendarPageData } from "@/lib/diary/get-diary-calendar-page-data";

export const unstable_instant = {
  prefetch: "static",
};

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    date?: string;
  }>;
};

export default function CalendarPage({ searchParams }: CalendarPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CalendarContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CalendarContent({ searchParams }: CalendarPageProps) {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const params = await searchParams;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  cacheTag(cacheTags.userProfile(appUser.id));
  cacheTag(cacheTags.userDiary(appUser.id));

  const data = await getDiaryCalendarPageData({
    supabase,
    month: params?.month,
    date: params?.date,
  });

  return (
    <AppLayout user={appUser}>
      <DiaryCalendarScreen data={data} />
    </AppLayout>
  );
}
