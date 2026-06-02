import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMomentScreen } from "@/components/moments/edit-moment-screen";
import { getEditableMoment } from "@/lib/moments/get-editable-moment";

type EditMomentPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function EditMomentPage({ params }: EditMomentPageProps) {
  const { momentId } = await params;
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

  const moment = await getEditableMoment({
    supabase,
    momentId,
    userId: user.id,
  });

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <EditMomentScreen moment={moment} />
    </AppLayout>
  );
}
