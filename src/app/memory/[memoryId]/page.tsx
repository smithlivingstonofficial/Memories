import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MemoryDetailScreen } from "@/components/memory/memory-detail-screen";
import { getMemoryDetailData } from "@/lib/memories/get-memory-detail-data";

type MemoryDetailPageProps = {
  params: Promise<{
    memoryId: string;
  }>;
};

export default async function MemoryDetailPage({
  params,
}: MemoryDetailPageProps) {
  const { memoryId } = await params;

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

  const data = await getMemoryDetailData({
    supabase,
    memoryId,
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
      <MemoryDetailScreen data={data} />
    </AppLayout>
  );
}