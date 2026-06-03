import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";

type ComingSoonScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  primaryHref: string;
  primaryLabel: string;
  points: string[];
};

export function ComingSoonScreen({
  eyebrow,
  title,
  description,
  icon,
  primaryHref,
  primaryLabel,
  points,
}: ComingSoonScreenProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-[1120px] items-center">
      <section className="mem-card w-full overflow-hidden rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Clock3 size={14} />
              Coming soon
            </span>

            <div className="mb-5 flex size-14 items-center justify-center rounded-[1.35rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
              {icon}
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              {eyebrow}
            </p>

            <h1 className="font-brand max-w-2xl text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              {title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--app-muted)] sm:text-base sm:leading-7">
              {description}
            </p>

            <Link
              href={primaryHref}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(99,102,241,0.22)] transition hover:bg-[var(--app-accent-hover)]"
            >
              {primaryLabel}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-soft)] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Sparkles size={14} />
              Planned polish
            </div>

            <div className="grid gap-3">
              {points.map((point) => (
                <div
                  key={point}
                  className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4"
                >
                  <p className="text-sm font-semibold leading-6 text-[var(--app-text)]">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
