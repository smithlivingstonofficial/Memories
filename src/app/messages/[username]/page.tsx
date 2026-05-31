import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { MessageThreadScreen } from "@/components/messages/message-thread-screen";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  if (profile.username === username) {
    redirect("/messages");
  }

  const data = await getMessageThreadDataByUsername({
    supabase,
    userId: user.id,
    username,
  });

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <MessageThreadScreen data={data} currentUserId={user.id} />
    </AppLayout>
  );
}