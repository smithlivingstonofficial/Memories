import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MessagesScreen } from "@/components/messages/messages-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMessagesInboxData } from "@/lib/messages/get-messages-data";

export default async function MessagesPage() {
  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getMessagesInboxData({
    supabase,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MessagesScreen data={data} />
    </AppLayout>
  );
}
