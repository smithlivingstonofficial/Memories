import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Bookmark } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/coming-soon-screen";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export const unstable_instant = false;

export default function KeepsakesPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <KeepsakesContent />
    </Suspense>
  );
}

async function KeepsakesContent() {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const appUser = await getAuthenticatedAppUser();

  return (
    <AppLayout user={appUser}>
      <ComingSoonScreen
        eyebrow="Keepsakes"
        title="Saved memories will have a calmer home here."
        description="Keepsakes will collect the memories you intentionally save, so favorite moments do not get lost inside the feed, diary, or Vault."
        icon={<Bookmark size={26} />}
        primaryHref="/home"
        primaryLabel="Browse memories"
        points={[
          "Save important memories from cards and detail pages.",
          "Review personal highlights without changing privacy.",
          "Organize meaningful moments separately from daily writing.",
        ]}
      />
    </AppLayout>
  );
}
