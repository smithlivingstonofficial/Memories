import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { EditMomentScreen } from "@/components/moments/edit-moment-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getEditableMoment } from "@/lib/moments/get-editable-moment";

type EditMomentPageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function EditMomentPage({ params }: EditMomentPageProps) {
  const { momentId } = await params;
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const moment = await getEditableMoment({
    supabase,
    momentId,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <EditMomentScreen moment={moment} />
    </AppLayout>
  );
}
