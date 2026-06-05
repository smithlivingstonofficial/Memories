import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Camera,
  Clock3,
  Filter,
  ImagePlus,
  LockKeyhole,
  PenLine,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  DiaryTimelineEntry,
  DiaryTimelinePageData,
} from "@/lib/diary/get-diary-timeline-page-data";

type DiaryTimelineScreenProps = {
  data: DiaryTimelinePageData;
};

export function DiaryTimelineScreen({ data }: DiaryTimelineScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5">
      <TimelineHero data={data} />

      <section className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  <Clock3 size={14} />
                  Life timeline
                </div>

                <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                  {data.entries.length > 0
                    ? `${data.entries.length} diary entries`
                    : "No entries found"}
                </h2>
              </div>

              <Link
                href="/create/memory"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:opacity-90"
              >
                <PenLine size={16} />
                Write entry
              </Link>
            </div>

            {data.groups.length === 0 ? (
              <EmptyTimeline />
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {data.groups.map((group) => (
                  <div key={group.month}>
                    <div className="sticky top-0 z-10 mb-3 rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)]/90 px-4 py-3 shadow-[0_14px_34px_var(--app-shadow)] backdrop-blur-2xl sm:mb-4 sm:rounded-2xl">
                      <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                        {group.monthLabel}
                      </h3>
                      <p className="text-xs text-[var(--app-muted)]">
                        {group.entries.length} entries
                      </p>
                    </div>

                    <div className="relative space-y-4">
                      <div className="absolute bottom-3 left-5 top-3 hidden w-px bg-gradient-to-b from-transparent via-[var(--app-border)] to-transparent sm:block" />

                      {group.entries.map((entry) => (
                        <TimelineEntryCard
                          key={`${entry.type}-${entry.id}`}
                          entry={entry}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-4 sm:space-y-5">
          <TimelineFilters data={data} />
          <TimelineStats data={data} />
          <QuickActions />
        </aside>
      </section>
    </div>
  );
}

function TimelineHero({ data }: { data: DiaryTimelinePageData }) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-2xl sm:rounded-[1.8rem] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.26),transparent_34%)]" />

      <div className="relative grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            <Sparkles size={14} />
            Timeline
          </div>

          <h1 className="font-brand max-w-3xl text-2xl font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
            Your life archive
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/calendar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] sm:h-12 sm:px-5"
          >
            <CalendarDays size={17} />
            Calendar
          </Link>

          <Link
            href="/create/memory"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:opacity-90 sm:h-12 sm:px-5"
          >
            <PenLine size={17} />
            <span className="hidden sm:inline">Write Diary</span>
            <span className="sm:hidden">Write</span>
          </Link>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        <HeroStat label="Entries" value={data.stats.totalEntries} />
        <HeroStat label="Memories" value={data.stats.memoryCount} />
        <HeroStat label="Vault" value={data.stats.vaultCount} />
        <HeroStat label="Media" value={data.stats.mediaCount} />
        <HeroStat label="Favorites" value={data.stats.favoriteCount} />
      </div>
    </section>
  );
}

function TimelineFilters({ data }: { data: DiaryTimelinePageData }) {
  return (
    <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 flex items-center gap-3 sm:mb-5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          <Filter size={18} />
        </div>

        <div>
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Filters
          </h2>
          <p className="text-xs text-[var(--app-muted)]">
            Find diary entries quickly.
          </p>
        </div>
      </div>

      <form action="/timeline" className="space-y-3 sm:space-y-4">
        <FilterField label="Search">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            />
            <input
              name="q"
              defaultValue={data.filters.q}
              placeholder="Search memories..."
              className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"
            />
          </div>
        </FilterField>

        <FilterField label="Type">
          <select
            name="type"
            defaultValue={data.filters.type}
            className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
          >
            <option value="all">All entries</option>
            <option value="memory">Memories</option>
            <option value="vault">Vault</option>
          </select>
        </FilterField>

        <FilterField label="Month">
          <select
            name="month"
            defaultValue={data.filters.month}
            className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
          >
            <option value="">All months</option>
            {data.availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label} ({month.count})
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Mood">
          <select
            name="mood"
            defaultValue={data.filters.mood}
            className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
          >
            <option value="">All moods</option>
            {data.availableMoods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Tag">
          <select
            name="tag"
            defaultValue={data.filters.tag}
            className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
          >
            <option value="">All tags</option>
            {data.availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </FilterField>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/timeline"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
          >
            Reset
          </Link>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white transition hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>
    </section>
  );
}

function TimelineStats({ data }: { data: DiaryTimelinePageData }) {
  return (
    <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
      <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        Timeline summary
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-1">
        <SummaryRow label="Total entries" value={data.stats.totalEntries} />
        <SummaryRow label="Memories" value={data.stats.memoryCount} />
        <SummaryRow label="Vault entries" value={data.stats.vaultCount} />
        <SummaryRow label="Media items" value={data.stats.mediaCount} />
        <SummaryRow label="Favorites" value={data.stats.favoriteCount} />
      </div>
    </section>
  );
}

function QuickActions() {
  return (
    <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
      <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        Quick actions
      </h2>

      <div className="mt-4 grid gap-3">
        <QuickAction
          href="/create/memory"
          icon={PenLine}
          title="Write Memory"
          description="Add a diary entry"
        />

        <QuickAction
          href="/create/vault"
          icon={LockKeyhole}
          title="Write in Vault"
          description="Private thoughts only"
        />

        <QuickAction
          href="/create/moment"
          icon={Camera}
          title="Quick Capture"
          description="Photo or video moment"
        />
      </div>
    </section>
  );
}

function TimelineEntryCard({ entry }: { entry: DiaryTimelineEntry }) {
  const href = entry.type === "vault" ? "/vault" : `/memory/${entry.id}`;

  return (
    <article className="relative sm:pl-14">
      <div className="absolute left-0 top-5 hidden size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-accent)] shadow-[0_12px_30px_var(--app-shadow)] sm:flex">
        {entry.type === "vault" ? (
          <LockKeyhole size={16} />
        ) : (
          <PenLine size={16} />
        )}
      </div>

      <Link
        href={href}
        className="block rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-[0_14px_34px_var(--app-shadow)] transition hover:border-[var(--app-accent)] sm:rounded-[1.7rem] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                {entry.type === "vault" ? "Vault" : "Memory"}
              </span>

              <span className="text-xs font-medium text-[var(--app-muted)]">
                {formatShortDate(entry.entryDate)}
              </span>

              <span className="text-xs font-medium text-[var(--app-muted)]">
                {formatPrivacy(entry.privacy)}
              </span>
            </div>

            <h3 className="font-brand text-xl font-semibold leading-tight tracking-[-0.04em] text-[var(--app-text)]">
              {entry.title}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[var(--app-muted)]">
            {entry.mediaCount > 0 && <ImagePlus size={16} />}
            {entry.isFavorite && <Star size={16} />}
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[var(--app-muted)] sm:leading-7">
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

function EmptyTimeline() {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 text-center sm:rounded-[2rem] sm:p-8">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Clock3 size={26} />
      </div>

      <h3 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        No timeline entries found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Start writing memories or adjust your filters to see more diary entries.
      </p>

      <Link
        href="/create/memory"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <PenLine size={17} />
        Write first entry
      </Link>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2.5 sm:rounded-[1.35rem] sm:p-3.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)] sm:text-[10px] sm:tracking-[0.16em]">
        {label}
      </p>

      <p className="mt-1 font-brand text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
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

function formatPrivacy(value: string) {
  const labels: Record<string, string> = {
    public: "Public",
    private: "Private",
    followers: "Followers",
    inner_circle: "Inner Circle",
    vault: "Vault",
  };

  return labels[value] ?? value;
}
