import "server-only";

import { notFound } from "next/navigation";
import { createSignedReadUrl } from "@/lib/r2";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export type EditableMoment = {
  id: string;
  caption: string;
  mood: string;
  visibility: "public" | "followers" | "inner_circle" | "private";
  expiresAt: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: "manual" | "browser_gps" | "media_gps" | "mixed_media" | "unknown";
  locationConfidence: number | null;
  locationAccuracyMeters: number | null;
  media: {
    id: string;
    url: string;
    mimeType: string | null;
    mediaKind: "image" | "video";
  } | null;
};

type MomentRow = {
  id: string;
  owner_id: string;
  caption: string | null;
  mood: string | null;
  visibility: EditableMoment["visibility"];
  expires_at: string;
  is_archived: boolean;
  cleanup_status: string;
  location_name: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: EditableMoment["locationSource"] | null;
  location_confidence: number | null;
  location_accuracy_meters: number | null;
};

type MomentMediaRow = {
  id: string;
  object_key: string;
  public_url: string | null;
  media_kind: "image" | "video";
  mime_type: string | null;
};

export async function getEditableMoment({
  supabase,
  momentId,
  userId,
}: {
  supabase: SupabaseClient;
  momentId: string;
  userId: string;
}): Promise<EditableMoment> {
  const { data, error } = await supabase
    .from("moments")
    .select(
      "id, owner_id, caption, mood, visibility, expires_at, is_archived, cleanup_status, location_name, location_label, latitude, longitude, location_source, location_confidence, location_accuracy_meters"
    )
    .eq("id", momentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const moment = data as MomentRow;

  if (
    moment.owner_id !== userId ||
    moment.is_archived ||
    moment.cleanup_status !== "active" ||
    new Date(moment.expires_at).getTime() <= Date.now()
  ) {
    notFound();
  }

  const { data: mediaData } = await supabase
    .from("moment_media")
    .select("id, object_key, public_url, media_kind, mime_type")
    .eq("moment_id", moment.id)
    .eq("upload_status", "uploaded")
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const mediaRow = mediaData as MomentMediaRow | null;
  const media = mediaRow
    ? {
        id: mediaRow.id,
        url: mediaRow.public_url ?? (await createSignedReadUrl(mediaRow.object_key)),
        mimeType: mediaRow.mime_type,
        mediaKind: mediaRow.media_kind,
      }
    : null;

  return {
    id: moment.id,
    caption: moment.caption ?? "",
    mood: moment.mood ?? "Peaceful",
    visibility: moment.visibility,
    expiresAt: moment.expires_at,
    locationName: moment.location_label ?? moment.location_name ?? "",
    latitude: moment.latitude,
    longitude: moment.longitude,
    locationSource: moment.location_source ?? "unknown",
    locationConfidence: moment.location_confidence,
    locationAccuracyMeters: moment.location_accuracy_meters,
    media,
  };
}
