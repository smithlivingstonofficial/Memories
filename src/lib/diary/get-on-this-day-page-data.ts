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
  stats: {
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
    favoriteCount: number;
    oldestYear: string | null;
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

  return {
    today,
    todayLabel: formatTodayLabel(today),
    entries,
    stats: getStats(entries),
  };
}