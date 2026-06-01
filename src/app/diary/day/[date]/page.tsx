import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiaryDayScreen } from "@/components/diary/diary-day-screen";
import { getDiaryDayPageData } from "@/lib/diary/get-diary-day-page-data";

type DiaryDayPageProps = {
  params: Promise<{
    date: string;
  }>;
};

export default async function DiaryDayPage({ params }: DiaryDayPageProps) {
  const { date } = await params;

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

  const data = await getDiaryDayPageData({
    supabase,
    date,
  });

  return (
    <AppLayout
      user={{
        id: user.id,
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <DiaryDayScreen data={data} />
    </AppLayout>
  );
}
