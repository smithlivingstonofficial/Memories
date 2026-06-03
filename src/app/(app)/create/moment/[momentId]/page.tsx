import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppContentLoading } from "@/components/layout/app-content-loading";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { momentId: "00000000-0000-4000-8000-000000000001" } }],
};

type LegacyMomentViewerPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default function LegacyMomentViewerPage({
  params,
}: LegacyMomentViewerPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <LegacyMomentViewerRedirect params={params} />
    </Suspense>
  );
}

async function LegacyMomentViewerRedirect({
  params,
}: LegacyMomentViewerPageProps) {
  const { momentId } = await params;
  redirect(`/moment/${momentId}`);

  return null;
}
