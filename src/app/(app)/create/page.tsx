import { AppLayout } from "@/components/layout/app-layout";
import { CreateHubScreen } from "@/components/create/create-hub-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export default async function CreatePage() {
  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <CreateHubScreen />
    </AppLayout>
  );
}
