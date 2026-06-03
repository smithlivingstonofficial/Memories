import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryTimelineScreen } from "@/components/diary/diary-timeline-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getDiaryTimelinePageData } from "@/lib/diary/get-diary-timeline-page-data";

type TimelinePageProps = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    month?: string;
    mood?: string;
    tag?: string;
  }>;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const params = await searchParams;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

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
