import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { AppLayout } from "@/components/layout/app-layout";
import { AppContentLoading } from "@/components/layout/app-content-loading";
import { SecuritySettingsScreen } from "@/components/settings/security-settings-screen";
import { getAccountPasswordVerificationState } from "@/app/actions/security";
import { getAuthenticatedAppUser } from "@/lib/auth/get-authenticated-app-user";
import { cacheTags } from "@/lib/cache-tags";

export const unstable_instant = {
  prefetch: "static",
};

type SecuritySettingsPageProps = {
  searchParams?: Promise<{
    verified?: string;
    error?: string;
  }>;
};

export default function SecuritySettingsPage({
  searchParams,
}: SecuritySettingsPageProps) {
  return (
    <Suspense fallback={<AppContentLoading />}>
      <SecuritySettingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SecuritySettingsContent({
  searchParams,
}: SecuritySettingsPageProps) {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 180 });

  const params = await searchParams;
  const appUser = await getAuthenticatedAppUser();
  cacheTag(cacheTags.userProfile(appUser.id));
  const verification = await getAccountPasswordVerificationState(appUser.id);

  return (
    <AppLayout user={appUser}>
      <SecuritySettingsScreen
        email={appUser.email ?? "Unknown email"}
        accountVerification={verification}
        statusMessage={getStatusMessage(params?.verified, params?.error)}
      />
    </AppLayout>
  );
}

function getStatusMessage(verified?: string, error?: string) {
  if (verified === "google") {
    return "Google account verified. You can now set a new account password.";
  }

  if (error === "verification_expired") {
    return "Google verification expired. Please verify again.";
  }

  if (error === "verification_missing") {
    return "Google verification could not be found. Please verify again.";
  }

  if (error === "missing_email") {
    return "Your account does not have an email address to verify.";
  }

  if (error === "google_auth_failed") {
    return "Google verification could not be started. Please try again.";
  }

  if (error === "verification_failed") {
    return "Unable to create a security verification. Please try again.";
  }

  return undefined;
}
