import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { MessageThreadScreen } from "@/components/messages/message-thread-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMessageThreadDataByUsername } from "@/lib/messages/get-messages-data";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ params: { username: "sampleuser" } }],
};

type MessageThreadPageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default function MessageThreadPage({
  params,
}: MessageThreadPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <MessageThreadContent params={params} />
    </Suspense>
  );
}

async function MessageThreadContent({ params }: MessageThreadPageProps) {
  "use cache: private";
  cacheLife({ stale: 10, revalidate: 20, expire: 120 });

  const { username } = await params;

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  if (appUser.username === username) {
    redirect("/messages");
  }

  const data = await getMessageThreadDataByUsername({
    supabase,
    userId: appUser.id,
    username,
  });

  return (
    <AppLayout user={appUser}>
      <MessageThreadScreen data={data} currentUserId={appUser.id} />
    </AppLayout>
  );
}
