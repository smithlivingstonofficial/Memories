import "server-only";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export type OnThisDayEntry = {
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
  yearsAgo: number;
  createdAt: string;
  updatedAt: string;
};

export type OnThisDayPageData = {
  today: string;
  todayLabel: string;
  entries: OnThisDayEntry[];
  lookbackWindows: OnThisDayLookbackWindow[];
  stats: {
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
    favoriteCount: number;
    oldestYear: string | null;
  };
};

export type OnThisDayLookbackWindow = {
  id: "week" | "month" | "year";
  label: string;
  date: string;
  dateLabel: string;
  entries: OnThisDayEntry[];
  stats: {
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
  };
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

type LookbackEntryRow = Omit<OnThisDayRow, "content_preview" | "years_ago"> & {
  content: string | null;
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

function formatTodayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function mapEntry(row: OnThisDayRow): OnThisDayEntry {
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

function getStats(entries: OnThisDayEntry[]) {
  return {
    totalEntries: entries.length,
    memoryCount: entries.filter((entry) => entry.type === "memory").length,
    vaultCount: entries.filter((entry) => entry.type === "vault").length,
    mediaCount: entries.reduce((sum, entry) => sum + entry.mediaCount, 0),
    favoriteCount: entries.filter((entry) => entry.isFavorite).length,
    oldestYear:
      entries.length > 0
        ? entries
            .map((entry) => entry.entryDate.slice(0, 4))
            .sort((a, b) => a.localeCompare(b))[0]
        : null,
  };
}

function cleanText(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function previewText(value: string | null) {
  const clean = cleanText(value);
  if (!clean) return "No preview available yet.";
  return clean.length > 220 ? `${clean.slice(0, 220)}...` : clean;
}

function mapLookbackEntry(row: LookbackEntryRow): OnThisDayEntry {
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
    yearsAgo: Math.max(
      0,
      new Date().getUTCFullYear() - Number(row.entry_date.slice(0, 4))
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return formatDateKey(date);
}

function addMonths(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + amount, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return formatDateKey(target);
}

function addYears(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = new Date(Date.UTC(year + amount, month - 1, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return formatDateKey(target);
}

function formatDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getCompactStats(entries: OnThisDayEntry[]) {
  return {
    totalEntries: entries.length,
    memoryCount: entries.filter((entry) => entry.type === "memory").length,
    vaultCount: entries.filter((entry) => entry.type === "vault").length,
    mediaCount: entries.reduce((sum, entry) => sum + entry.mediaCount, 0),
  };
}

async function getEntriesForDate(supabase: SupabaseClient, date: string) {
  const { data, error } = await supabase
    .from("diary_entries")
    .select(
      "entry_id, entry_type, entry_date, title, content, moods, tags, privacy, media_count, is_favorite, created_at, updated_at"
    )
    .eq("entry_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LookbackEntryRow[]).map(mapLookbackEntry);
}

async function getLookbackWindows(
  supabase: SupabaseClient,
  today: string
): Promise<OnThisDayLookbackWindow[]> {
  const windows = [
    { id: "week" as const, label: "1 week before", date: addDays(today, -7) },
    { id: "month" as const, label: "1 month before", date: addMonths(today, -1) },
    { id: "year" as const, label: "1 year before", date: addYears(today, -1) },
  ];

  const entriesByWindow = await Promise.all(
    windows.map(async (window) => ({
      ...window,
      entries: await getEntriesForDate(supabase, window.date),
    }))
  );

  return entriesByWindow.map((window) => ({
    ...window,
    dateLabel: formatDateLabel(window.date),
    stats: getCompactStats(window.entries),
  }));
}

export async function getOnThisDayPageData(
  supabase: SupabaseClient
): Promise<OnThisDayPageData> {
  const today = getTodayInTimeZone();

  const { data, error } = await supabase.rpc("get_on_this_day_entries", {
    target_date: today,
  });

  if (error) {
    throw new Error(error.message);
  }

  const entries = ((data ?? []) as OnThisDayRow[]).map(mapEntry);
  const lookbackWindows = await getLookbackWindows(supabase, today);

  return {
    today,
    todayLabel: formatTodayLabel(today),
    entries,
    lookbackWindows,
    stats: getStats(entries),
  };
}
