import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateMemoryScreen } from "@/components/create/create-memory-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
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
  const appUser = await getAuthenticatedAppUser();

  const vaultAccess = await getVaultAccessState(supabase, appUser.id);

  return (
    <AppLayout user={appUser}>
      <CreateMemoryScreen
        initialEntryDate={initialEntryDate}
        draftSource={draftSource}
        vaultAccess={vaultAccess}
        user={appUser}
      />
    </AppLayout>
  );
}
