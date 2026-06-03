import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MomentViewerScreen } from "@/components/moments/moment-viewer-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMomentViewerData } from "@/lib/moments/get-moment-viewer-data";

type MomentViewerPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function MomentViewerPage({
  params,
}: MomentViewerPageProps) {
  const { momentId } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getMomentViewerData({
    supabase,
    momentId,
    viewerId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MomentViewerScreen data={data} />
    </AppLayout>
  );
}
