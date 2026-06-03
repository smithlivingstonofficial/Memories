import type { ReactNode } from "react";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export const unstable_instant = {
  prefetch: "static",
  unstable_disableValidation: true,
};

export default function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  );
}

async function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  "use cache: private";
  cacheLife({ stale: 45, revalidate: 60, expire: 300 });

  const user = await getAuthenticatedAppUser();

  return <AppLayout user={user}>{children}</AppLayout>;
}
