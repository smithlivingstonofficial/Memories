import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";
import { cacheTags } from "@/lib/cache-tags";
import { withQueryTimer } from "@/lib/debug/performance-timer";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedAppUser = {
  id: string;
  email: string | null;
  fullName: string;
  username: string;
  avatarUrl: string | null;
};

export async function getAuthenticatedAppUser(): Promise<AuthenticatedAppUser> {
  "use cache: private";
  cacheLife({ stale: 120, revalidate: 300, expire: 900 });

  const supabase = await createClient();

  const {
    data: { user },
  } = await withQueryTimer("auth-user", supabase.auth.getUser());

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await withQueryTimer(
    "profile-load",
    supabase
      .from("profiles")
      .select("username, full_name, avatar_url, profile_completed, password_set")
      .eq("id", user.id)
      .maybeSingle()
  );

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  cacheTag(cacheTags.userProfile(user.id));

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile.full_name ?? "Memories User",
    username: profile.username ?? "memories_user",
    avatarUrl: profile.avatar_url ?? null,
  };
}
