import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ImagePlus,
  LockKeyhole,
  PenLine,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  DiaryCalendarDay,
  DiaryCalendarPageData,
  DiaryDayEntry,
} from "@/lib/diary/get-diary-calendar-page-data";

type DiaryCalendarScreenProps = {
  data: DiaryCalendarPageData;
};

type CalendarCell = {
  date: string | null;
  label: number | null;
  isToday: boolean;
  isSelected: boolean;
  day: DiaryCalendarDay | null;
};

export function DiaryCalendarScreen({ data }: DiaryCalendarScreenProps) {
  const cells = buildCalendarCells({
    targetMonth: data.targetMonth,
    today: data.today,
    selectedDate: data.selectedDate,
    calendarDays: data.calendarDays,
  });

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-2xl sm:rounded-[1.8rem] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.26),transparent_34%)]" />

        <div className="relative grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <CalendarDays size={14} />
              Calendar
            </div>

            <h1 className="font-brand truncate text-2xl font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              {data.monthLabel}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/calendar?month=${data.previousMonth.slice(0, 7)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] sm:h-12 sm:px-5"
            >
              <ArrowLeft size={17} />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Link>

            <Link
              href={`/calendar?month=${data.nextMonth.slice(0, 7)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:opacity-90 sm:h-12 sm:px-5"
            >
              Next
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Active days" value={data.monthStats.activeDays} />
          <StatCard label="Entries" value={data.monthStats.totalEntries} />
          <StatCard label="Memories" value={data.monthStats.memoryCount} />
          <StatCard label="Vault" value={data.monthStats.vaultCount} />
          <StatCard
            label="Top mood"
            value={data.monthStats.topMood ?? "None"}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="mem-card rounded-[1.6rem] p-3 sm:rounded-[2rem] sm:p-5">
          <div className="mb-3 flex flex-row items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="font-brand text-xl font-semibold tracking-[-0.045em] text-[var(--app-text)] sm:text-2xl">
                Month view
              </h2>
            </div>

            <Link
              href={`/calendar?month=${data.today.slice(0, 7)}&date=${data.today}`}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] sm:h-10 sm:px-4"
            >
              Today
            </Link>
          </div>

          <div
            className="grid gap-1.5 sm:gap-2"
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
                <CalendarDateCell
                  key={cell.date}
                  cell={cell}
                  monthKey={data.targetMonth.slice(0, 7)}
                />
              ) : (
                <div
                  key={`empty-${index}`}
                  className="min-h-[58px] rounded-2xl border border-transparent sm:min-h-[86px] lg:min-h-[118px]"
                />
              )
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--app-muted)]">
            <LegendDot className="bg-[var(--app-accent)]" label="Mood" />
            <LegendDot className="bg-emerald-400" label="Media" />
            <LegendDot className="bg-amber-400" label="Vault" />
          </div>
        </div>

        <aside className="space-y-4 sm:space-y-5">
          <SelectedDayPanel data={data} />

          <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Quick actions
            </h2>

            <div className="mt-4 grid gap-3">
              <QuickAction
                href={`/create/memory?date=${data.selectedDate}`}
                icon={PenLine}
                title="Write for selected day"
                description={data.selectedDateLabel}
              />

              <QuickAction
                href="/create/vault"
                icon={LockKeyhole}
                title="Write in Vault"
                description="Private diary space"
              />

              <QuickAction
                href="/create/moment"
                icon={Camera}
                title="Quick Capture"
                description="Photo or video moment"
              />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function CalendarDateCell({
  cell,
  monthKey,
}: {
  cell: CalendarCell;
  monthKey: string;
}) {
  return (
    <Link
      href={`/calendar?month=${monthKey}&date=${cell.date}`}
      className={[
        "group flex min-h-[58px] flex-col rounded-[1.1rem] border p-1.5 text-left transition sm:min-h-[86px] sm:rounded-2xl sm:p-2 lg:min-h-[118px] lg:p-3",
        cell.isSelected
          ? "border-[var(--app-accent)] bg-[var(--app-soft)] shadow-[0_16px_45px_var(--app-shadow)]"
          : cell.isToday
            ? "border-[var(--app-accent)] bg-[var(--app-surface-strong)]"
            : cell.day
              ? "border-[var(--app-border)] bg-[var(--app-surface-strong)] hover:border-[var(--app-accent)]"
              : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-accent)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            "text-sm font-semibold leading-none lg:text-base",
            cell.isSelected || cell.isToday
              ? "text-[var(--app-accent)]"
              : "text-[var(--app-text)]",
          ].join(" ")}
        >
          {cell.label}
        </span>

        {cell.day && (
          <span className="rounded-full bg-[var(--app-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--app-accent)] sm:px-2 sm:text-[10px]">
            {cell.day.totalEntries}
          </span>
        )}
      </div>

      {cell.day ? (
        <div className="mt-auto pt-2 sm:pt-4">
          <div className="mb-2 hidden text-xs font-medium text-[var(--app-muted)] lg:block">
            {cell.day.memoryCount > 0 && `${cell.day.memoryCount} memory`}
            {cell.day.memoryCount > 0 && cell.day.vaultCount > 0 && " • "}
            {cell.day.vaultCount > 0 && `${cell.day.vaultCount} vault`}
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {cell.day.moods.slice(0, 3).map((mood) => (
              <span
                key={mood}
                title={mood}
                className="size-1.5 rounded-full bg-[var(--app-accent)] sm:size-2"
              />
            ))}

            {cell.day.hasMedia && (
              <span
                title="Has media"
                className="size-1.5 rounded-full bg-emerald-400 sm:size-2"
              />
            )}

            {cell.day.hasVault && (
              <span
                title="Has vault"
                className="size-1.5 rounded-full bg-amber-400 sm:size-2"
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

function SelectedDayPanel({ data }: { data: DiaryCalendarPageData }) {
  return (
    <section className="mem-card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 sm:mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <Sparkles size={14} />
          Selected day
        </div>

        <h2 className="font-brand text-2xl font-semibold leading-tight tracking-[-0.05em] text-[var(--app-text)]">
          {data.selectedDateLabel}
        </h2>

        <p className="mt-1 text-sm text-[var(--app-muted)]">
          {data.selectedDayEntries.length} entries saved.
        </p>
      </div>

      {data.selectedDayEntries.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 text-center sm:rounded-[1.7rem]">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
            <PenLine size={22} />
          </div>

          <h3 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            No entries for this day
          </h3>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Write a memory for this date and it will appear in your calendar.
          </p>

          <Link
            href={`/create/memory?date=${data.selectedDate}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Write entry
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.selectedDayEntries.map((entry) => (
            <DayEntryCard key={`${entry.type}-${entry.id}`} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

function DayEntryCard({ entry }: { entry: DiaryDayEntry }) {
  const href = entry.type === "vault" ? "/vault" : `/memory/${entry.id}`;

  return (
    <Link
      href={href}
      className="block rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 transition hover:border-[var(--app-accent)] sm:rounded-[1.5rem]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
            {entry.type === "vault" ? "Vault" : "Memory"}
          </span>

          <span className="text-xs text-[var(--app-muted)]">
            {formatTime(entry.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[var(--app-muted)]">
          {entry.mediaCount > 0 && <ImagePlus size={15} />}
          {entry.isFavorite && <Star size={15} />}
        </div>
      </div>

      <h3 className="font-brand text-base font-semibold tracking-[-0.035em] text-[var(--app-text)]">
        {entry.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
        {entry.preview}
      </p>

      {entry.moods.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.moods.slice(0, 4).map((mood) => (
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

function StatCard({ label, value }: { label: string; value: string | number }) {
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

function buildCalendarCells({
  targetMonth,
  today,
  selectedDate,
  calendarDays,
}: {
  targetMonth: string;
  today: string;
  selectedDate: string;
  calendarDays: DiaryCalendarDay[];
}): CalendarCell[] {
  const [year, month] = targetMonth.split("-").map(Number);
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
      isSelected: false,
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
      isSelected: date === selectedDate,
      day: dayMap.get(date) ?? null,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      label: null,
      isToday: false,
      isSelected: false,
      day: null,
    });
  }

  return cells;
}

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
