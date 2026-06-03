import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MessageThreadScreen } from "@/components/messages/message-thread-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getMessageThreadDataByUsername } from "@/lib/messages/get-messages-data";

type MessageThreadPageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function MessageThreadPage({
  params,
}: MessageThreadPageProps) {
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
