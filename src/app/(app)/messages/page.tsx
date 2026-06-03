import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { MessagesScreen } from "@/components/messages/messages-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMessagesInboxData } from "@/lib/messages/get-messages-data";

export const unstable_instant = {
  prefetch: "static",
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <MessagesContent />
    </Suspense>
  );
}

async function MessagesContent() {
  "use cache: private";
  cacheLife({ stale: 15, revalidate: 30, expire: 120 });

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getMessagesInboxData({
    supabase,
    userId: appUser.id,
  });

  return (
    <AppLayout user={appUser}>
      <MessagesScreen
        key={data.conversations.map((conversation) => conversation.id).join(":")}
        data={data}
        currentUserId={appUser.id}
      />
    </AppLayout>
  );
}
