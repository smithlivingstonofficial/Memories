import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateMemoryScreen } from "@/components/create/create-memory-screen";
import { normalizeEntryDate } from "@/lib/diary/entry-date";
import { getVaultAccessState } from "@/lib/vault/access";

type CreateMemoryPageProps = {
  searchParams?: Promise<{
    date?: string;
    draft?: string;
  }>;
};

export default async function CreateMemoryPage({
  searchParams,
}: CreateMemoryPageProps) {
  const params = await searchParams;
  const initialEntryDate = normalizeEntryDate(params?.date);
  const draftSource = params?.draft === "quick" ? "quick" : undefined;

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

  const vaultAccess = await getVaultAccessState(supabase, user.id);

  return (
    <AppLayout
      user={{
        id: user.id,
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <CreateMemoryScreen
        initialEntryDate={initialEntryDate}
        draftSource={draftSource}
        vaultAccess={vaultAccess}
        user={{
          id: user.id,
          fullName: profile.full_name ?? "Memories User",
          username: profile.username ?? "memories_user",
          avatarUrl: profile.avatar_url ?? null,
        }}
      />
    </AppLayout>
  );
}
