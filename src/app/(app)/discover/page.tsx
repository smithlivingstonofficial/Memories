import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { DiscoverPeopleScreen } from "@/components/discover/discover-people-screen";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { getDiscoverPeopleData } from "@/lib/discover/get-discover-people-data";

type DiscoverPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  const supabase = await createClient();
  const appUser = await getAuthenticatedAppUser();

  const data = await getDiscoverPeopleData({
    supabase,
    userId: appUser.id,
    query,
  });

  return (
    <AppLayout user={appUser}>
      <DiscoverPeopleScreen data={data} />
    </AppLayout>
  );
}
