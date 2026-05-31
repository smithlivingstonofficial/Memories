import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryCalendarScreen } from "@/components/diary/diary-calendar-screen";
import { getDiaryCalendarPageData } from "@/lib/diary/get-diary-calendar-page-data";

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    date?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;

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

  const data = await getDiaryCalendarPageData({
    supabase,
    month: params?.month,
    date: params?.date,
  });

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <DiaryCalendarScreen data={data} />
    </AppLayout>
  );
}