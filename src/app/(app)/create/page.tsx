import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { CreateHubScreen } from "@/components/create/create-hub-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export const unstable_instant = false;

export default function CreatePage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateContent />
    </Suspense>
  );
}

async function CreateContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <CreateHubScreen />
    </AppLayout>
  );
}
