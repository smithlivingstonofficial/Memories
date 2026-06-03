import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditProfileScreen } from "@/components/profile/edit-profile-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getProfilePageData } from "@/lib/profile/get-profile-page-data";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const fallback = {
    fullName: appUser.fullName,
    username: appUser.username,
    avatarUrl: appUser.avatarUrl,
  };

  const data = await getProfilePageData({
    supabase,
    userId: appUser.id,
    fallbackProfile: fallback,
  });

  return (
    <AppLayout user={appUser}>
      <EditProfileScreen
        initialProfile={{
          fullName: data.profile.fullName,
          username: data.profile.username,
          bio: data.profile.bio,
          avatarUrl: data.profile.avatarUrl,
          coverUrl: data.profile.coverUrl,
          accountVisibility: data.profile.accountVisibility,
        }}
      />
    </AppLayout>
  );
}
