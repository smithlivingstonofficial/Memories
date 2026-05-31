import "server-only";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

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

export type DiaryEntryPreview = {
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
  yearsAgo?: number;
  createdAt: string;
  updatedAt: string;
};

export type DiaryDashboardSummary = {
  todayEntries: number;
  monthEntries: number;
  totalEntries: number;
  memoryEntries: number;
  vaultEntries: number;
  mediaEntries: number;
  favoriteEntries: number;
  latestEntryDate: string | null;
  activeDaysThisMonth: number;
  writingStreak: number;
  topMood: string | null;
};

export type DiaryDashboardData = {
  today: string;
  todayLabel: string;
  monthLabel: string;
  summary: DiaryDashboardSummary;
  calendarDays: DiaryCalendarDay[];
  todayEntries: DiaryEntryPreview[];
  recentEntries: DiaryEntryPreview[];
  onThisDayEntries: DiaryEntryPreview[];
};

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

type DiaryEntryRow = {
  entry_id: string;
  entry_type: "memory" | "vault";
  entry_date: string;
  title: string;
  content: string | null;
  moods: string[] | null;
  tags: string[] | null;
  privacy: string;
  media_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

type OnThisDayRow = {
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
  years_ago: number;
  created_at: string;
  updated_at: string;
};

type SummaryRow = {
  today_entries: number;
  month_entries: number;
  total_entries: number;
  memory_entries: number;
  vault_entries: number;
  media_entries: number;
  favorite_entries: number;
  latest_entry_date: string | null;
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

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatTodayLabel(dateKey: string) {
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

function formatMonthLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function cleanText(content: string | null) {
  return (content ?? "").replace(/\s+/g, " ").trim();
}

function previewText(content: string | null, max = 180) {
  const clean = cleanText(content);

  if (!clean) return "No preview available yet.";

  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
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

function mapDayEntry(row: DayEntryRow): DiaryEntryPreview {
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

function mapDiaryEntry(row: DiaryEntryRow): DiaryEntryPreview {
  return {
    id: row.entry_id,
    type: row.entry_type,
    entryDate: row.entry_date,
    title: row.title,
    preview: previewText(row.content),
    moods: row.moods ?? [],
    tags: row.tags ?? [],
    privacy: row.privacy,
    mediaCount: row.media_count ?? 0,
    isFavorite: row.is_favorite ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOnThisDayEntry(row: OnThisDayRow): DiaryEntryPreview {
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
    yearsAgo: row.years_ago ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTopMood(days: DiaryCalendarDay[]) {
  const moodCount = new Map<string, number>();

  for (const day of days) {
    for (const mood of day.moods) {
      if (!mood.trim()) continue;
      moodCount.set(mood, (moodCount.get(mood) ?? 0) + 1);
    }
  }

  return Array.from(moodCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function getWritingStreak(today: string, days: DiaryCalendarDay[]) {
  const writtenDays = new Set(days.map((day) => day.entryDate));
  let cursor = today;
  let streak = 0;

  while (writtenDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export async function getDiaryDashboardData(
  supabase: SupabaseClient
): Promise<DiaryDashboardData> {
  const today = getTodayInTimeZone();

  const [
    summaryResult,
    calendarResult,
    todayEntriesResult,
    recentEntriesResult,
    onThisDayResult,
  ] = await Promise.all([
    supabase.rpc("get_diary_dashboard_summary", {
      target_date: today,
    }),

    supabase.rpc("get_diary_calendar_month", {
      target_month: today,
    }),

    supabase.rpc("get_diary_day_entries", {
      target_date: today,
    }),

    supabase
      .from("diary_entries")
      .select(
        "entry_id, entry_type, entry_date, title, content, moods, tags, privacy, media_count, is_favorite, created_at, updated_at"
      )
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),

    supabase.rpc("get_on_this_day_entries", {
      target_date: today,
    }),
  ]);

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  if (calendarResult.error) {
    throw new Error(calendarResult.error.message);
  }

  if (todayEntriesResult.error) {
    throw new Error(todayEntriesResult.error.message);
  }

  if (recentEntriesResult.error) {
    throw new Error(recentEntriesResult.error.message);
  }

  const summaryRows = (summaryResult.data ?? []) as SummaryRow[];
  const summaryRow = summaryRows[0] ?? {
    today_entries: 0,
    month_entries: 0,
    total_entries: 0,
    memory_entries: 0,
    vault_entries: 0,
    media_entries: 0,
    favorite_entries: 0,
    latest_entry_date: null,
  };

  const calendarDays = ((calendarResult.data ?? []) as CalendarDayRow[]).map(
    mapCalendarDay
  );

  const onThisDayEntries = onThisDayResult.error
    ? []
    : ((onThisDayResult.data ?? []) as OnThisDayRow[])
        .slice(0, 3)
        .map(mapOnThisDayEntry);

  return {
    today,
    todayLabel: formatTodayLabel(today),
    monthLabel: formatMonthLabel(today),
    summary: {
      todayEntries: summaryRow.today_entries ?? 0,
      monthEntries: summaryRow.month_entries ?? 0,
      totalEntries: summaryRow.total_entries ?? 0,
      memoryEntries: summaryRow.memory_entries ?? 0,
      vaultEntries: summaryRow.vault_entries ?? 0,
      mediaEntries: summaryRow.media_entries ?? 0,
      favoriteEntries: summaryRow.favorite_entries ?? 0,
      latestEntryDate: summaryRow.latest_entry_date,
      activeDaysThisMonth: calendarDays.length,
      writingStreak: getWritingStreak(today, calendarDays),
      topMood: getTopMood(calendarDays),
    },
    calendarDays,
    todayEntries: ((todayEntriesResult.data ?? []) as DayEntryRow[]).map(
      mapDayEntry
    ),
    recentEntries: ((recentEntriesResult.data ?? []) as DiaryEntryRow[]).map(
      mapDiaryEntry
    ),
    onThisDayEntries,
  };
}