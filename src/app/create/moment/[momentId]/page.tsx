import { redirect } from "next/navigation";

type LegacyMomentViewerPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function LegacyMomentViewerPage({
  params,
}: LegacyMomentViewerPageProps) {
  const { momentId } = await params;
  redirect(`/moment/${momentId}`);
}
