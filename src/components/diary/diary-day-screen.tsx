import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Heart,
  ImagePlus,
  LockKeyhole,
  PenLine,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  DiaryDayEntry,
  DiaryDayPageData,
} from "@/lib/diary/get-diary-day-page-data";

type DiaryDayScreenProps = {
  data: DiaryDayPageData;
};

export function DiaryDayScreen({ data }: DiaryDayScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <DayHero data={data} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 space-y-5">
          <EntriesSection data={data} />
        </main>

        <aside className="space-y-5">
          <DayStats data={data} />
          <QuickActions data={data} />
          <DayPrivacyNote />
        </aside>
      </section>
    </div>
  );
}

function DayHero({ data }: { data: DiaryDayPageData }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(99,102,241,0.20),transparent_30%),radial-gradient(circle_at_92%_95%,rgba(255,228,230,0.30),transparent_34%)]" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
            <CalendarDays size={14} />
            Diary day
          </div>

          <h1 className="font-brand max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.06em] text-[var(--app-text)] sm:text-5xl">
            {data.selectedDateLabel}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--app-muted)] sm:text-base">
            Review everything you saved for this day — memories, Vault entries,
            moods, media, and private reflections.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[480px]">
          <Link
            href={`/diary/day/${data.previousDate}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
          >
            <ArrowLeft size={16} />
            Previous
          </Link>

          <Link
            href={`/calendar?month=${data.selectedDate.slice(0, 7)}&date=${
              data.selectedDate
            }`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
          >
            <CalendarDays size={16} />
            Calendar
          </Link>

          <Link
            href={`/diary/day/${data.nextDate}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Next
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HeroStat label="Entries" value={data.stats.totalEntries} />
        <HeroStat label="Memories" value={data.stats.memoryCount} />
        <HeroStat label="Vault" value={data.stats.vaultCount} />
        <HeroStat label="Media" value={data.stats.mediaCount} />
        <HeroStat label="Top Mood" value={data.stats.topMood ?? "None"} />
      </div>
    </section>
  );
}

function EntriesSection({ data }: { data: DiaryDayPageData }) {
  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            <Sparkles size={14} />
            Day entries
          </div>

          <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
            {data.entries.length > 0
              ? `${data.entries.length} saved entries`
              : "No entries yet"}
          </h2>

          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {data.entries.length > 0
              ? "Your diary activity for this date."
              : "Write something for this date to begin its timeline."}
          </p>
        </div>

        <Link
          href={`/create/memory?date=${data.selectedDate}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <PenLine size={16} />
          Write entry
        </Link>
      </div>

      {data.entries.length === 0 ? (
        <EmptyDay selectedDate={data.selectedDate} />
      ) : (
        <div className="relative space-y-4">
          <div className="absolute bottom-3 left-5 top-3 hidden w-px bg-[var(--app-border)] sm:block" />

          {data.entries.map((entry) => (
            <EntryTimelineCard key={`${entry.type}-${entry.id}`} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

function EntryTimelineCard({ entry }: { entry: DiaryDayEntry }) {
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
                {entry.type === "vault" ? "Vault" : "Memory"}
              </span>

              <span className="text-xs font-medium text-[var(--app-muted)]">
                {formatTime(entry.createdAt)}
              </span>

              <span className="text-xs font-medium text-[var(--app-muted)]">
                {formatPrivacy(entry.privacy)}
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

            {entry.tags.slice(0, 4).map((tag) => (
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

function DayStats({ data }: { data: DiaryDayPageData }) {
  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          <Heart size={18} />
        </div>

        <div>
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Day summary
          </h2>
          <p className="text-xs text-[var(--app-muted)]">
            Calm overview of this date.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <SummaryRow label="Total entries" value={data.stats.totalEntries} />
        <SummaryRow label="Memory entries" value={data.stats.memoryCount} />
        <SummaryRow label="Vault entries" value={data.stats.vaultCount} />
        <SummaryRow label="Media items" value={data.stats.mediaCount} />
        <SummaryRow label="Favorites" value={data.stats.favoriteCount} />
        <SummaryRow label="Top mood" value={data.stats.topMood ?? "None"} />
      </div>

      {data.stats.moods.length > 0 && (
        <div className="mt-5 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
            Moods
          </p>

          <div className="flex flex-wrap gap-2">
            {data.stats.moods.map((mood) => (
              <span
                key={mood}
                className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]"
              >
                {mood}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function QuickActions({ data }: { data: DiaryDayPageData }) {
  return (
    <section className="mem-card rounded-[2rem] p-5">
      <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        Quick actions
      </h2>

      <div className="mt-4 grid gap-3">
        <QuickAction
          href={`/create/memory?date=${data.selectedDate}`}
          icon={PenLine}
          title="Write Memory"
          description="Add a diary entry for this date"
        />

        <QuickAction
          href="/create/vault"
          icon={LockKeyhole}
          title="Write in Vault"
          description="Private thoughts only for you"
        />

        <QuickAction
          href="/create/moment"
          icon={Camera}
          title="Quick Capture"
          description="Capture photo or video"
        />
      </div>
    </section>
  );
}

function DayPrivacyNote() {
  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="flex items-start gap-3 rounded-[1.5rem] bg-[var(--app-soft)] p-4">
        <LockKeyhole
          size={18}
          className="mt-0.5 shrink-0 text-[var(--app-accent)]"
        />

        <div>
          <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[var(--app-text)]">
            Private day view
          </h3>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            This day page is part of your private diary system. Vault and private
            entries stay visible only to you.
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyDay({ selectedDate }: { selectedDate: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <PenLine size={26} />
      </div>

      <h3 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        This day is still empty
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Add a memory, feeling, photo, or private reflection for this date.
      </p>

      <Link
        href={`/create/memory?date=${selectedDate}`}
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <PenLine size={17} />
        Write for this day
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

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3">
      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--app-text)]">{value}</p>
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

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
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
