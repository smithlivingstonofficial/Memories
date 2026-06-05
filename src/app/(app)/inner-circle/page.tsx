import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Users } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/coming-soon-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export const unstable_instant = false;

export default function InnerCirclePage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <InnerCircleContent />
    </Suspense>
  );
}

async function InnerCircleContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <ComingSoonScreen
        eyebrow="Inner Circle"
        title="Trusted sharing is getting its own careful space."
        description="Inner Circle will let people share selected memories with the few people they trust most, without making every private moment social by default."
        icon={<Users size={26} />}
        primaryHref="/discover"
        primaryLabel="Find people"
        points={[
          "Build a private trusted list from accepted followers.",
          "Share memories only with selected close people.",
          "Keep clear controls for who can see each memory.",
        ]}
      />
    </AppLayout>
  );
}
