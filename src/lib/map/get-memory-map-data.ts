import "server-only";

import { withQueryTimer } from "@/lib/debug/performance-timer";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export type MemoryMapItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  privacy: string;
  locationName: string | null;
  locationLat: number;
  locationLng: number;
};

type MemoryMapRow = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  privacy: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  latitude: number | null;
  longitude: number | null;
};

export async function getMemoryMapData({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<MemoryMapItem[]> {
  const result = await withQueryTimer(
    "memory-map-data",
    supabase
      .from("memories")
      .select(
        "id, title, content, created_at, privacy, location_name, location_lat, location_lng, latitude, longitude"
      )
      .eq("owner_id", userId)
      .or(
        "and(location_lat.not.is.null,location_lng.not.is.null),and(latitude.not.is.null,longitude.not.is.null)"
      )
      .order("created_at", { ascending: false })
      .limit(200)
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return ((result.data ?? []) as MemoryMapRow[])
    .map((memory) => {
      const locationLat = memory.location_lat ?? memory.latitude;
      const locationLng = memory.location_lng ?? memory.longitude;

      if (typeof locationLat !== "number" || typeof locationLng !== "number") {
        return null;
      }

      return {
        id: memory.id,
        title: memory.title?.trim() || "Untitled memory",
        content: memory.content ?? "",
        createdAt: memory.created_at,
        privacy: memory.privacy,
        locationName: memory.location_name,
        locationLat,
        locationLng,
      };
    })
    .filter((memory): memory is MemoryMapItem => memory !== null);
}
