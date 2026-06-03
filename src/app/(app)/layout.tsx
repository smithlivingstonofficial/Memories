import { AppLayout } from "@/components/layout/app-layout";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedAppUser();

  return <AppLayout user={user}>{children}</AppLayout>;
}
