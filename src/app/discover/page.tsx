import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiscoverPeopleScreen } from "@/components/discover/discover-people-screen";
import { getDiscoverPeopleData } from "@/lib/discover/get-discover-people-data";

type DiscoverPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: privateProfile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!privateProfile?.profile_completed || !privateProfile?.password_set) {
    redirect("/complete-profile");
  }

  const data = await getDiscoverPeopleData({
    supabase,
    userId: user.id,
    query,
  });

  return (
    <AppLayout
      user={{
        fullName: privateProfile.full_name ?? "Memories User",
        username: privateProfile.username ?? "memories_user",
        avatarUrl: privateProfile.avatar_url ?? null,
      }}
    >
      <DiscoverPeopleScreen data={data} />
    </AppLayout>
  );
}