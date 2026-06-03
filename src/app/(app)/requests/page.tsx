import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { FollowRequestsScreen } from "@/components/profile/follow-requests-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getFollowRequestsData } from "@/lib/follows/get-follow-requests-data";

export default async function RequestsPage() {
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getFollowRequestsData({
    supabase,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <FollowRequestsScreen data={data} />
    </AppLayout>
  );
}
