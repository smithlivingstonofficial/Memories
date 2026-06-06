// src/app/signup/page.tsx

import { SignupScreen } from "@/components/auth/signup-screen";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed, password_set")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.profile_completed && profile?.password_set) {
      redirect("/home");
    }

    redirect("/complete-profile");
  }

  return <SignupScreen />;
}
