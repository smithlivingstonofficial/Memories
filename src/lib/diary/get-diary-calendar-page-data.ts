import "server-only";

export type DiaryCalendarDay = {
  entryDate: string;
  totalEntries: number;
  memoryCount: number;
  vaultCount: number;
  privateCount: number;
  publicCount: number;
  mediaCount: number;
  moods: string[];
  hasVault: boolean;
  hasMedia: boolean;
};

export type DiaryDayEntry = {
  id: string;
  type: "memory" | "vault";
  entryDate: string;
  title: string;
  preview: string;
  moods: string[];
  tags: string[];
  privacy: string;
  mediaCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DiaryCalendarPageData = {
  today: string;
  targetMonth: string;
  monthLabel: string;
  previousMonth: string;
  nextMonth: string;
  selectedDate: string;
  selectedDateLabel: string;
  calendarDays: DiaryCalendarDay[];
  selectedDayEntries: DiaryDayEntry[];
  monthStats: {
    activeDays: number;
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
    topMood: string | null;
  };
};

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type CalendarDayRow = {
  entry_date: string;
  total_entries: number;
  memory_count: number;
  vault_count: number;
  private_count: number;
  public_count: number;
  media_count: number;
  moods: string[] | null;
  has_vault: boolean;
  has_media: boolean;
};

type DayEntryRow = {
  entry_id: string;
  entry_type: "memory" | "vault";
  entry_date: string;
  title: string;
  content_preview: string | null;
  moods: string[] | null;
  tags: string[] | null;
  privacy: string;
  media_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

function getTodayInTimeZone(timeZone = "Asia/Kolkata") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function isValidMonth(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function isValidDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function toMonthStart(monthKey: string) {
  return `${monthKey}-01`;
}

function addMonths(dateKey: string, amount: number) {
  const [year, month] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function formatMonthLabel(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatSelectedDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function mapCalendarDay(row: CalendarDayRow): DiaryCalendarDay {
  return {
    entryDate: row.entry_date,
    totalEntries: row.total_entries ?? 0,
    memoryCount: row.memory_count ?? 0,
    vaultCount: row.vault_count ?? 0,
    privateCount: row.private_count ?? 0,
    publicCount: row.public_count ?? 0,
    mediaCount: row.media_count ?? 0,
    moods: row.moods ?? [],
    hasVault: row.has_vault ?? false,
    hasMedia: row.has_media ?? false,
  };
}

function mapDayEntry(row: DayEntryRow): DiaryDayEntry {
  return {
    id: row.entry_id,
    type: row.entry_type,
    entryDate: row.entry_date,
    title: row.title,
    preview: row.content_preview || "No preview available yet.",
    moods: row.moods ?? [],
    tags: row.tags ?? [],
    privacy: row.privacy,
    mediaCount: row.media_count ?? 0,
    isFavorite: row.is_favorite ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getMonthStats(days: DiaryCalendarDay[]) {
  const moodCount = new Map<string, number>();

  for (const day of days) {
    for (const mood of day.moods) {
      moodCount.set(mood, (moodCount.get(mood) ?? 0) + 1);
    }
  }

  const topMood =
    Array.from(moodCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  return {
    activeDays: days.length,
    totalEntries: days.reduce((sum, day) => sum + day.totalEntries, 0),
    memoryCount: days.reduce((sum, day) => sum + day.memoryCount, 0),
    vaultCount: days.reduce((sum, day) => sum + day.vaultCount, 0),
    mediaCount: days.reduce((sum, day) => sum + day.mediaCount, 0),
    topMood,
  };
}

export async function getDiaryCalendarPageData({
  supabase,
  month,
  date,
}: {
  supabase: SupabaseClient;
  month?: string;
  date?: string;
}): Promise<DiaryCalendarPageData> {
  const today = getTodayInTimeZone();
  const currentMonthKey = today.slice(0, 7);

  const monthKey = isValidMonth(month) ? month! : currentMonthKey;
  const targetMonth = toMonthStart(monthKey);

  const calendarResult = await supabase.rpc("get_diary_calendar_month", {
    target_month: targetMonth,
  });

  if (calendarResult.error) {
    throw new Error(calendarResult.error.message);
  }

  const calendarDays = ((calendarResult.data ?? []) as CalendarDayRow[]).map(
    mapCalendarDay
  );

  const selectedDate =
    isValidDate(date) && date!.slice(0, 7) === monthKey
      ? date!
      : monthKey === currentMonthKey
        ? today
        : calendarDays[0]?.entryDate ?? targetMonth;

  const selectedDayResult = await supabase.rpc("get_diary_day_entries", {
    target_date: selectedDate,
  });

  if (selectedDayResult.error) {
    throw new Error(selectedDayResult.error.message);
  }

  return {
    today,
    targetMonth,
    monthLabel: formatMonthLabel(targetMonth),
    previousMonth: addMonths(targetMonth, -1),
    nextMonth: addMonths(targetMonth, 1),
    selectedDate,
    selectedDateLabel: formatSelectedDateLabel(selectedDate),
    calendarDays,
    selectedDayEntries: ((selectedDayResult.data ?? []) as DayEntryRow[]).map(
      mapDayEntry
    ),
    monthStats: getMonthStats(calendarDays),
  };
}