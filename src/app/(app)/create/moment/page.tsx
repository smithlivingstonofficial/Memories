import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { CreateMomentScreen } from "@/components/create/create-moment-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export const unstable_instant = {
  prefetch: "static",
};

export default function CreateMomentPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <CreateMomentContent />
    </Suspense>
  );
}

async function CreateMomentContent() {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 180 });

  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <CreateMomentScreen user={appUser} />
    </AppLayout>
  );
}
