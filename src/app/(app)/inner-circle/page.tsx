import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export const unstable_instant = {
  prefetch: "static",
};

export default function InnerCirclePage() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <section className="mem-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Users size={14} />
              Inner Circle
            </span>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-4xl">
              Trusted people will live here
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
              Inner Circle is ready as a navigation destination while the
              trusted sharing experience is completed.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
          >
            Find people
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
