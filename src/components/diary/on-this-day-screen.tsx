import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Clock3,
  Heart,
  ImagePlus,
  LockKeyhole,
  PenLine,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  OnThisDayEntry,
  OnThisDayPageData,
} from "@/lib/diary/get-on-this-day-page-data";

type OnThisDayScreenProps = {
  data: OnThisDayPageData;
};

export function OnThisDayScreen({ data }: OnThisDayScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(99,102,241,0.20),transparent_30%),radial-gradient(circle_at_92%_95%,rgba(255,228,230,0.30),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
              <Sparkles size={14} />
              On this day
            </div>

            <h1 className="font-brand max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.06em] text-[var(--app-text)] sm:text-5xl">
              Memories from {data.todayLabel}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--app-muted)] sm:text-base">
              Revisit what you wrote on this same date in previous years. This
              is your personal time capsule.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
            >
              <CalendarDays size={17} />
              Dashboard
            </Link>

            <Link
              href="/create/memory"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <PenLine size={17} />
              Write Today
            </Link>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <HeroStat label="Entries" value={data.stats.totalEntries} />
          <HeroStat label="Memories" value={data.stats.memoryCount} />
          <HeroStat label="Vault" value={data.stats.vaultCount} />
          <HeroStat label="Media" value={data.stats.mediaCount} />
          <HeroStat label="Oldest Year" value={data.stats.oldestYear ?? "None"} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="mem-card rounded-[2rem] p-5">
          <div className="mb-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Clock3 size={14} />
              Time capsule
            </div>

            <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
              {data.entries.length > 0
                ? `${data.entries.length} memories found`
                : "No memories yet"}
            </h2>

            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Past diary entries from the same date.
            </p>
          </div>

          {data.entries.length === 0 ? (
            <EmptyOnThisDay />
          ) : (
            <div className="relative space-y-4">
              <div className="absolute bottom-3 left-5 top-3 hidden w-px bg-[var(--app-border)] sm:block" />

              {data.entries.map((entry) => (
                <OnThisDayEntryCard
                  key={`${entry.type}-${entry.id}`}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </main>

        <aside className="space-y-5">
          <section className="mem-card rounded-[2rem] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <Heart size={18} />
              </div>

              <div>
                <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Reflection
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  A quiet moment to revisit.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[var(--app-soft)] p-4 text-sm leading-7 text-[var(--app-muted)]">
              What changed since then? What stayed the same? What would you say
              to the person who wrote those memories?
            </div>
          </section>

          <section className="mem-card rounded-[2rem] p-5">
            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Quick actions
            </h2>

            <div className="mt-4 grid gap-3">
              <QuickAction
                href="/create/memory"
                icon={PenLine}
                title="Write Today"
                description="Add a new memory for today"
              />

              <QuickAction
                href="/calendar"
                icon={CalendarDays}
                title="Open Calendar"
                description="Browse diary by date"
              />

              <QuickAction
                href="/timeline"
                icon={Clock3}
                title="Open Timeline"
                description="Explore your life archive"
              />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function OnThisDayEntryCard({ entry }: { entry: OnThisDayEntry }) {
  const href = entry.type === "vault" ? "/vault" : `/memory/${entry.id}`;

  return (
    <article className="relative sm:pl-14">
      <div className="absolute left-0 top-5 hidden size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-accent)] sm:flex">
        {entry.type === "vault" ? (
          <LockKeyhole size={16} />
        ) : (
          <PenLine size={16} />
        )}
      </div>

      <Link
        href={href}
        className="block rounded-[1.7rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 transition hover:border-[var(--app-accent)] sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                {entry.yearsAgo} year{entry.yearsAgo > 1 ? "s" : ""} ago
              </span>

              <span className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
                {entry.type === "vault" ? "Vault" : "Memory"}
              </span>

              <span className="text-xs font-medium text-[var(--app-muted)]">
                {formatShortDate(entry.entryDate)}
              </span>
            </div>

            <h3 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              {entry.title}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[var(--app-muted)]">
            {entry.mediaCount > 0 && <ImagePlus size={16} />}
            {entry.isFavorite && <Star size={16} />}
          </div>
        </div>

        <p className="text-sm leading-7 text-[var(--app-muted)]">
          {entry.preview}
        </p>

        {(entry.moods.length > 0 || entry.tags.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {entry.moods.slice(0, 5).map((mood) => (
              <span
                key={mood}
                className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]"
              >
                {mood}
              </span>
            ))}

            {entry.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}

function EmptyOnThisDay() {
  return (
    <div className="rounded-[2rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Sparkles size={26} />
      </div>

      <h3 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        No memories from this date yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Keep writing. After a year, this page will become your personal time
        capsule.
      </p>

      <Link
        href="/create/memory"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <PenLine size={17} />
        Write today
      </Link>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
        {label}
      </p>

      <p className="mt-2 font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 transition hover:border-[var(--app-accent)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
        <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
          {description}
        </p>
      </div>
    </Link>
  );
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}