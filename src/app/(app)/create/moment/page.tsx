import { AppLayout } from "@/components/layout/app-layout";
import { CreateMomentScreen } from "@/components/create/create-moment-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export default async function CreateMomentPage() {
  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <CreateMomentScreen user={appUser} />
    </AppLayout>
  );
}
