import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Clock3,
  Flame,
  Heart,
  ImagePlus,
  LockKeyhole,
  PenLine,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import type {
  DiaryCalendarDay,
  DiaryDashboardData,
  DiaryEntryPreview,
} from "@/lib/diary/get-diary-dashboard-data";

type DiaryDashboardScreenProps = {
  data: DiaryDashboardData;
};

type CalendarCell = {
  date: string | null;
  label: number | null;
  isToday: boolean;
  day: DiaryCalendarDay | null;
};

export function DiaryDashboardScreen({ data }: DiaryDashboardScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <Hero data={data} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 space-y-5">
          <DashboardCalendar
            today={data.today}
            monthLabel={data.monthLabel}
            calendarDays={data.calendarDays}
          />

          <RecentTimeline entries={data.recentEntries} />
        </main>

        <aside className="space-y-5">
          <TodayBoard data={data} />
          <MonthlyPulse data={data} />
          <OnThisDay entries={data.onThisDayEntries} />
        </aside>
      </section>
    </div>
  );
}

function Hero({ data }: { data: DiaryDashboardData }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-2xl sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.26),transparent_34%)]" />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
              <Sparkles size={14} />
              Dashboard
            </span>

            <span className="text-xs font-medium text-[var(--app-muted)]">
              {data.todayLabel}
            </span>
          </div>

          <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="font-brand truncate text-2xl font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Your Memory Dashboard
            </h1>

            <div className="grid w-full grid-cols-2 gap-3 lg:flex lg:w-auto lg:items-center lg:justify-end">
              <Link
                href={`/create/memory?date=${data.today}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:opacity-90 lg:flex-none lg:px-6"
              >
                <PenLine size={16} />
                <span className="hidden sm:inline">Write today</span>
                <span className="sm:hidden">Write</span>
              </Link>

              <Link
                href="/create/moment"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] lg:flex-none lg:px-6"
              >
                <Camera size={16} />
                <span className="hidden sm:inline">Quick capture</span>
                <span className="sm:hidden">Capture</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <HeroStat
            icon={BookOpen}
            label="Today"
            value={data.summary.todayEntries}
            description="entries"
          />
          <HeroStat
            icon={CalendarDays}
            label="Month"
            value={data.summary.monthEntries}
            description={`${data.summary.activeDaysThisMonth} active days`}
          />
          <HeroStat
            icon={Flame}
            label="Streak"
            value={data.summary.writingStreak}
            description="days"
          />
          <HeroStat
            icon={LockKeyhole}
            label="Vault"
            value={data.summary.vaultEntries}
            description="private"
          />
        </div>
      </div>
    </section>
  );
}

function DashboardCalendar({
  today,
  monthLabel,
  calendarDays,
}: {
  today: string;
  monthLabel: string;
  calendarDays: DiaryCalendarDay[];
}) {
  const cells = buildCalendarCells(today, calendarDays);

  return (
    <section className="mem-card rounded-[2rem] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            <CalendarDays size={14} />
            Month view
          </div>

          <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
            {monthLabel}
          </h2>

          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Click a date to review diary entries from that day.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/diary/day/${today}`}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
          >
            Today
          </Link>

          <Link
            href="/calendar"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Full view
          </Link>
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="pb-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}

        {cells.map((cell, index) =>
          cell.date ? (
            <CalendarDateCell key={cell.date} cell={cell} />
          ) : (
            <div
              key={`empty-${index}`}
              className="min-h-[74px] rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] opacity-60 sm:min-h-[92px] lg:min-h-[112px]"
            />
          )
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--app-muted)]">
        <LegendDot className="bg-[var(--app-accent)]" label="Mood" />
        <LegendDot className="bg-emerald-400" label="Media" />
        <LegendDot className="bg-amber-400" label="Vault" />
      </div>
    </section>
  );
}

function CalendarDateCell({ cell }: { cell: CalendarCell }) {
  return (
    <Link
      href={`/diary/day/${cell.date}`}
      className={[
        "group flex min-h-[74px] flex-col rounded-2xl border p-2 text-left transition sm:min-h-[92px] sm:p-3 lg:min-h-[112px]",
        cell.isToday
          ? "border-[var(--app-accent)] bg-[var(--app-soft)] shadow-[0_16px_45px_var(--app-shadow)]"
          : cell.day
            ? "border-[var(--app-border)] bg-[var(--app-surface-strong)] hover:border-[var(--app-accent)]"
            : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-accent)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            "text-sm font-semibold lg:text-base",
            cell.isToday
              ? "text-[var(--app-accent)]"
              : "text-[var(--app-text)]",
          ].join(" ")}
        >
          {cell.label}
        </span>

        {cell.day && (
          <span className="rounded-full bg-[var(--app-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-accent)]">
            {cell.day.totalEntries}
          </span>
        )}
      </div>

      {cell.day ? (
        <div className="mt-auto pt-4">
          <div className="mb-2 hidden text-xs font-medium text-[var(--app-muted)] lg:block">
            {cell.day.memoryCount > 0 && `${cell.day.memoryCount} memory`}
            {cell.day.memoryCount > 0 && cell.day.vaultCount > 0 && " • "}
            {cell.day.vaultCount > 0 && `${cell.day.vaultCount} vault`}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {cell.day.moods.slice(0, 3).map((mood) => (
              <span
                key={mood}
                title={mood}
                className="size-2 rounded-full bg-[var(--app-accent)]"
              />
            ))}

            {cell.day.hasMedia && (
              <span
                title="Has media"
                className="size-2 rounded-full bg-emerald-400"
              />
            )}

            {cell.day.hasVault && (
              <span
                title="Has vault"
                className="size-2 rounded-full bg-amber-400"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-auto hidden text-xs text-[var(--app-muted)] opacity-0 transition group-hover:opacity-100 lg:block">
          Add entry
        </div>
      )}
    </Link>
  );
}

function TodayBoard({ data }: { data: DiaryDashboardData }) {
  const entries = data.todayEntries.slice(0, 2);

  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            <Heart size={14} />
            Today
          </div>

          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            {data.summary.todayEntries > 0 ? "Saved today" : "Today is ready"}
          </h2>
        </div>

        <Link
          href={`/diary/day/${data.today}`}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
        >
          Open
        </Link>
      </div>

      {entries.length === 0 ? (
        <CompactEmpty
          icon={PenLine}
          title="No entry yet"
          description="Write one honest line to make today visible in your diary."
          href={`/create/memory?date=${data.today}`}
          label="Write today"
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={`${entry.type}-${entry.id}`} entry={entry} />
          ))}
        </div>
      )}

      <Link
        href={`/create/memory?date=${data.today}`}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white transition hover:opacity-90"
      >
        Add today’s memory
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function RecentTimeline({ entries }: { entries: DiaryEntryPreview[] }) {
  const visibleEntries = entries.slice(0, 4);

  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            <Clock3 size={14} />
            Recent timeline
          </div>

          <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
            Your latest diary moments
          </h2>
        </div>

        <Link
          href="/timeline"
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
        >
          View all
        </Link>
      </div>

      {visibleEntries.length === 0 ? (
        <CompactEmpty
          icon={Clock3}
          title="Timeline is waiting"
          description="Your memories will appear here after you start writing."
          href="/create/memory"
          label="Create first entry"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleEntries.map((entry) => (
            <EntryCard key={`${entry.type}-${entry.id}`} entry={entry} large />
          ))}
        </div>
      )}
    </section>
  );
}

function OnThisDay({ entries }: { entries: DiaryEntryPreview[] }) {
  const firstEntry = entries[0];

  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <Star size={18} />
          </div>

          <div>
            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              On this day
            </h2>
            <p className="text-xs text-[var(--app-muted)]">
              Personal time capsule
            </p>
          </div>
        </div>

        <Link
          href="/on-this-day"
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)]"
        >
          View all
        </Link>
      </div>

      {!firstEntry ? (
        <Link
          href="/on-this-day"
          className="block rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 text-center transition hover:border-[var(--app-accent)]"
        >
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <Sparkles size={19} />
          </div>

          <p className="text-sm leading-6 text-[var(--app-muted)]">
            Keep writing. This section becomes powerful as your diary grows.
          </p>
        </Link>
      ) : (
        <Link
          href="/on-this-day"
          className="block overflow-hidden rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] transition hover:border-[var(--app-accent)]"
        >
          <div className="bg-[var(--app-soft)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
              {firstEntry.yearsAgo
                ? `${firstEntry.yearsAgo} year${
                    firstEntry.yearsAgo > 1 ? "s" : ""
                  } ago`
                : "Past memory"}
            </p>

            <h3 className="font-brand mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              {firstEntry.title}
            </h3>
          </div>

          <div className="p-4">
            <p className="line-clamp-3 text-sm leading-6 text-[var(--app-muted)]">
              {firstEntry.preview}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {firstEntry.moods.slice(0, 3).map((mood) => (
                <span
                  key={mood}
                  className="rounded-full bg-[var(--app-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--app-accent)]"
                >
                  {mood}
                </span>
              ))}
            </div>
          </div>
        </Link>
      )}
    </section>
  );
}

function MonthlyPulse({ data }: { data: DiaryDashboardData }) {
  const maxValue = Math.max(
    data.summary.monthEntries,
    data.summary.memoryEntries,
    data.summary.vaultEntries,
    data.summary.mediaEntries,
    1
  );

  return (
    <section className="mem-card rounded-[2rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          <TrendingUp size={18} />
        </div>

        <div>
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Monthly pulse
          </h2>
          <p className="text-xs text-[var(--app-muted)]">
            {data.summary.topMood
              ? `Mostly feeling ${data.summary.topMood}`
              : "Start adding moods to see patterns"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <PulseBar
          label="Entries"
          value={data.summary.monthEntries}
          max={maxValue}
        />
        <PulseBar
          label="Memories"
          value={data.summary.memoryEntries}
          max={maxValue}
        />
        <PulseBar label="Vault" value={data.summary.vaultEntries} max={maxValue} />
        <PulseBar label="Media" value={data.summary.mediaEntries} max={maxValue} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniMetric label="Active days" value={data.summary.activeDaysThisMonth} />
        <MiniMetric label="Favorites" value={data.summary.favoriteEntries} />
      </div>
    </section>
  );
}

function EntryCard({
  entry,
  large = false,
}: {
  entry: DiaryEntryPreview;
  large?: boolean;
}) {
  const href = entry.type === "vault" ? "/vault" : `/memory/${entry.id}`;

  return (
    <Link
      href={href}
      className="group flex min-h-full flex-col rounded-[1.55rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 transition hover:border-[var(--app-accent)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--app-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--app-accent)]">
            {entry.type === "vault" ? "Vault" : "Memory"}
          </span>

          <span className="text-xs font-medium text-[var(--app-muted)]">
            {formatShortDate(entry.entryDate)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[var(--app-muted)]">
          {entry.mediaCount > 0 && <ImagePlus size={15} />}
          {entry.isFavorite && <Star size={15} />}
        </div>
      </div>

      <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {entry.title}
      </h3>

      <p
        className={[
          "mt-2 text-sm leading-6 text-[var(--app-muted)]",
          large ? "line-clamp-3" : "line-clamp-2",
        ].join(" ")}
      >
        {entry.preview}
      </p>

      {entry.moods.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {entry.moods.slice(0, 3).map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-surface)] px-2.5 py-1 text-xs font-medium text-[var(--app-muted)]"
            >
              {mood}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--app-muted)]">
          {label}
        </p>

        <div className="mt-0.5 flex items-end gap-2">
          <p className="font-brand text-2xl font-semibold leading-none tracking-[-0.055em] text-[var(--app-text)]">
            {value}
          </p>

          <p className="truncate pb-0.5 text-xs font-medium text-[var(--app-muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function PulseBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = `${Math.max(6, Math.round((value / max) * 100))}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--app-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--app-text)]">{value}</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--app-soft)]">
        <div
          className="h-full rounded-full bg-[var(--app-accent)]"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
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

function CompactEmpty({
  icon: Icon,
  title,
  description,
  href,
  label,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Icon size={22} />
      </div>

      <h3 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {label}
      </Link>
    </div>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function buildCalendarCells(
  today: string,
  calendarDays: DiaryCalendarDay[]
): CalendarCell[] {
  const [year, month] = today.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startingWeekDay = firstDay.getUTCDay();

  const dayMap = new Map(calendarDays.map((day) => [day.entryDate, day]));
  const cells: CalendarCell[] = [];

  for (let index = 0; index < startingWeekDay; index += 1) {
    cells.push({
      date: null,
      label: null,
      isToday: false,
      day: null,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    cells.push({
      date,
      label: day,
      isToday: date === today,
      day: dayMap.get(date) ?? null,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      label: null,
      isToday: false,
      day: null,
    });
  }

  return cells;
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}