import "server-only";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export type TimelineEntryType = "all" | "memory" | "vault";

export type DiaryTimelineEntry = {
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

export type DiaryTimelineGroup = {
  year: string;
  month: string;
  monthLabel: string;
  entries: DiaryTimelineEntry[];
};

export type DiaryTimelinePageData = {
  filters: {
    q: string;
    type: TimelineEntryType;
    month: string;
    mood: string;
    tag: string;
  };
  entries: DiaryTimelineEntry[];
  groups: DiaryTimelineGroup[];
  availableMonths: {
    value: string;
    label: string;
    count: number;
  }[];
  availableMoods: string[];
  availableTags: string[];
  stats: {
    totalEntries: number;
    memoryCount: number;
    vaultCount: number;
    mediaCount: number;
    favoriteCount: number;
  };
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

function cleanText(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function previewText(value: string | null) {
  const clean = cleanText(value);
  if (!clean) return "No preview available yet.";
  return clean.length > 220 ? `${clean.slice(0, 220)}...` : clean;
}

function isValidType(value?: string): TimelineEntryType {
  if (value === "memory" || value === "vault") return value;
  return "all";
}

function isValidMonth(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function normalizeFilter(value?: string) {
  return decodeURIComponent(value ?? "").trim();
}

function mapEntry(row: DiaryEntryRow): DiaryTimelineEntry {
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

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function groupEntries(entries: DiaryTimelineEntry[]): DiaryTimelineGroup[] {
  const map = new Map<string, DiaryTimelineGroup>();

  for (const entry of entries) {
    const year = entry.entryDate.slice(0, 4);
    const month = entry.entryDate.slice(0, 7);
    const key = `${year}-${month}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        year,
        month,
        monthLabel: formatMonthLabel(month),
        entries: [entry],
      });
      continue;
    }

    existing.entries.push(entry);
  }

  return Array.from(map.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
}

function getStats(entries: DiaryTimelineEntry[]) {
  return {
    totalEntries: entries.length,
    memoryCount: entries.filter((entry) => entry.type === "memory").length,
    vaultCount: entries.filter((entry) => entry.type === "vault").length,
    mediaCount: entries.reduce((sum, entry) => sum + entry.mediaCount, 0),
    favoriteCount: entries.filter((entry) => entry.isFavorite).length,
  };
}

function getAvailableMonths(entries: DiaryTimelineEntry[]) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    const month = entry.entryDate.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, count]) => ({
      value,
      label: formatMonthLabel(value),
      count,
    }));
}

function getAvailableMoods(entries: DiaryTimelineEntry[]) {
  const set = new Set<string>();

  for (const entry of entries) {
    for (const mood of entry.moods) {
      if (mood.trim()) set.add(mood);
    }
  }

  return Array.from(set).sort();
}

function getAvailableTags(entries: DiaryTimelineEntry[]) {
  const set = new Set<string>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (tag.trim()) set.add(tag);
    }
  }

  return Array.from(set).sort();
}

export async function getDiaryTimelinePageData({
  supabase,
  q,
  type,
  month,
  mood,
  tag,
}: {
  supabase: SupabaseClient;
  q?: string;
  type?: string;
  month?: string;
  mood?: string;
  tag?: string;
}): Promise<DiaryTimelinePageData> {
  const filters = {
    q: normalizeFilter(q),
    type: isValidType(type),
    month: isValidMonth(month) ? month! : "",
    mood: normalizeFilter(mood),
    tag: normalizeFilter(tag),
  };

  const baseResult = await supabase
    .from("diary_entries")
    .select(
      "entry_id, entry_type, entry_date, title, content, moods, tags, privacy, media_count, is_favorite, created_at, updated_at"
    )
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (baseResult.error) {
    throw new Error(baseResult.error.message);
  }

  const allEntries = ((baseResult.data ?? []) as DiaryEntryRow[]).map(mapEntry);

  let entries = allEntries;

  if (filters.type !== "all") {
    entries = entries.filter((entry) => entry.type === filters.type);
  }

  if (filters.month) {
    entries = entries.filter((entry) => entry.entryDate.startsWith(filters.month));
  }

  if (filters.mood) {
    entries = entries.filter((entry) => entry.moods.includes(filters.mood));
  }

  if (filters.tag) {
    entries = entries.filter((entry) => entry.tags.includes(filters.tag));
  }

  if (filters.q) {
    const query = filters.q.toLowerCase();

    entries = entries.filter((entry) => {
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.preview.toLowerCase().includes(query) ||
        entry.moods.some((item) => item.toLowerCase().includes(query)) ||
        entry.tags.some((item) => item.toLowerCase().includes(query))
      );
    });
  }

  return {
    filters,
    entries,
    groups: groupEntries(entries),
    availableMonths: getAvailableMonths(allEntries),
    availableMoods: getAvailableMoods(allEntries),
    availableTags: getAvailableTags(allEntries),
    stats: getStats(entries),
  };
}