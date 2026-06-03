import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { OnThisDayScreen } from "@/components/diary/on-this-day-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getOnThisDayPageData } from "@/lib/diary/get-on-this-day-page-data";

export default async function OnThisDayPage() {
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getOnThisDayPageData(supabase);

  return (
    <AppLayout user={appUser}>
      <OnThisDayScreen data={data} />
    </AppLayout>
  );
}
