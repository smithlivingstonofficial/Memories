import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { SecuritySettingsScreen } from "@/components/settings/security-settings-screen";
import { getAccountPasswordVerificationState } from "@/app/actions/security";

type SecuritySettingsPageProps = {
  searchParams?: Promise<{
    verified?: string;
    error?: string;
  }>;
};

export default async function SecuritySettingsPage({
  searchParams,
}: SecuritySettingsPageProps) {
  const params = await searchParams;
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

  const verification = await getAccountPasswordVerificationState(user.id);

  return (
    <AppLayout
      user={{
        id: user.id,
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <SecuritySettingsScreen
        email={user.email ?? "Unknown email"}
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
