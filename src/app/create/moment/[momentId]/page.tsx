import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MomentViewerScreen } from "@/components/moments/moment-viewer-screen";
import { getMomentViewerData } from "@/lib/moments/get-moment-viewer-data";

type MomentViewerPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function MomentViewerPage({
  params,
}: MomentViewerPageProps) {
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

  const data = await getMomentViewerData({
    supabase,
    momentId,
    viewerId: user.id,
  });

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <MomentViewerScreen data={data} />
    </AppLayout>
  );
}