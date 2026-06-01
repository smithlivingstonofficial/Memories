import Link from "next/link";
import { Bookmark, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { createClient } from "@/lib/supabase/server";

export default async function KeepsakesPage() {
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

  return (
    <AppLayout
      user={{
        fullName: profile.full_name ?? "Memories User",
        username: profile.username ?? "memories_user",
        avatarUrl: profile.avatar_url ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <section className="mem-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                <Bookmark size={14} />
                Keepsakes
              </span>

              <h1 className="font-brand text-3xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-4xl">
                Saved memories will live here
              </h1>

              <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                Keepsakes is ready as a navigation destination while the saved
                memories experience is completed.
              </p>
            </div>

            <Link
              href="/home"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
            >
              Browse memories
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
