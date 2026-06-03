import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { PublicProfileScreen } from "@/components/profile/public-profile-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getPublicProfilePageData } from "@/lib/profile/get-public-profile-page-data";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getPublicProfilePageData({
    supabase,
    username,
    viewerId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <PublicProfileScreen data={data} />
    </AppLayout>
  );
}
