import "server-only";

import { notFound } from "next/navigation";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

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

export type DiaryDayPageData = {
  today: string;
  selectedDate: string;
  selectedDateLabel: string;
  previousDate: string;
  nextDate: string;
  entries: DiaryDayEntry[];
  stats: {
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
    favoriteCount: number;
    moods: string[];
    topMood: string | null;
  };
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

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
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

function getDayStats(entries: DiaryDayEntry[]) {
  const moodCount = new Map<string, number>();

  for (const entry of entries) {
    for (const mood of entry.moods) {
      moodCount.set(mood, (moodCount.get(mood) ?? 0) + 1);
    }
  }

  const moods = Array.from(moodCount.keys());
  const topMood =
    Array.from(moodCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  return {
    totalEntries: entries.length,
    memoryCount: entries.filter((entry) => entry.type === "memory").length,
    vaultCount: entries.filter((entry) => entry.type === "vault").length,
    mediaCount: entries.reduce((sum, entry) => sum + entry.mediaCount, 0),
    favoriteCount: entries.filter((entry) => entry.isFavorite).length,
    moods,
    topMood,
  };
}

export async function getDiaryDayPageData({
  supabase,
  date,
}: {
  supabase: SupabaseClient;
  date: string;
}): Promise<DiaryDayPageData> {
  if (!isValidDate(date)) {
    notFound();
  }

  const { data, error } = await supabase.rpc("get_diary_day_entries", {
    target_date: date,
  });

  if (error) {
    throw new Error(error.message);
  }

  const entries = ((data ?? []) as DayEntryRow[]).map(mapDayEntry);

  return {
    today: getTodayInTimeZone(),
    selectedDate: date,
    selectedDateLabel: formatSelectedDateLabel(date),
    previousDate: addDays(date, -1),
    nextDate: addDays(date, 1),
    entries,
    stats: getDayStats(entries),
  };
}