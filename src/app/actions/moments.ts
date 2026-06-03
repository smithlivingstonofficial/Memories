"use server";

import { revalidatePath } from "next/cache";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { markContentDraftPublished } from "@/app/actions/drafts";

export type MomentActionState = {
  success: boolean;
  message: string;
  momentId?: string;
};

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}, z.number().positive().optional());

const optionalNullableNumber = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}, z.number().nullable());

const LocationSourceSchema = z.enum([
  "manual",
  "browser_gps",
  "media_gps",
  "mixed_media",
  "unknown",
]);

const OptimizationStatusSchema = z.enum([
  "not_needed",
  "optimized",
  "skipped",
  "failed",
]);

const BooleanStringSchema = z.preprocess((value) => {
  return value === true || value === "true";
}, z.boolean());

const MomentLocationSchema = {
  locationName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || null),
  locationLabel: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => value || null),
  latitude: optionalNullableNumber.refine(
    (value) => value === null || (value >= -90 && value <= 90),
    "Invalid latitude."
  ),
  longitude: optionalNullableNumber.refine(
    (value) => value === null || (value >= -180 && value <= 180),
    "Invalid longitude."
  ),
  locationSource: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return "unknown";
    }

    return value;
  }, LocationSourceSchema),
  locationConfidence: optionalNullableNumber.refine(
    (value) => value === null || (value >= 0 && value <= 1),
    "Invalid location confidence."
  ),
  locationAccuracyMeters: optionalNullableNumber.refine(
    (value) => value === null || value >= 0,
    "Invalid location accuracy."
  ),
};

const CreateMomentSchema = z.object({
  objectKey: z.string().min(10),
  publicUrl: z.string().optional(),
  mediaKind: z.enum(["image", "video"]),
  mimeType: z.string().min(3),
  sizeBytes: z.coerce.number().int().positive().max(120 * 1024 * 1024),
  width: optionalNumber,
  height: optionalNumber,
  durationSeconds: optionalNumber,
  mediaLatitude: optionalNullableNumber,
  mediaLongitude: optionalNullableNumber,
  originalSizeBytes: z.coerce.number().int().positive().optional(),
  optimizedSizeBytes: z.coerce.number().int().positive().optional(),
  optimizationStatus: OptimizationStatusSchema.default("not_needed"),
  usedForLocationSuggestion: BooleanStringSchema.default(false),
  caption: z.string().trim().max(280).optional(),
  mood: z.string().trim().max(40).optional(),
  visibility: z.enum(["public", "followers", "inner_circle", "private"]),
  ...MomentLocationSchema,
});

const EditMomentSchema = z.object({
  momentId: z.string().uuid(),
  caption: z.string().trim().max(280).optional(),
  mood: z.string().trim().max(40).optional(),
  visibility: z.enum(["public", "followers", "inner_circle", "private"]),
  ...MomentLocationSchema,
});

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function deleteR2Object(objectKey: string) {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const client = getR2Client();

  if (!bucket || !client) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );
  } catch {
    // Do not block user flow because of cleanup failure.
  }
}

export async function createMomentAction(
  formData: FormData
): Promise<MomentActionState> {
  const parsed = CreateMomentSchema.safeParse({
    objectKey: formData.get("objectKey"),
    publicUrl: String(formData.get("publicUrl") ?? ""),
    mediaKind: formData.get("mediaKind"),
    mimeType: formData.get("mimeType"),
    sizeBytes: formData.get("sizeBytes"),
    width: formData.get("width"),
    height: formData.get("height"),
    durationSeconds: formData.get("durationSeconds"),
    mediaLatitude: formData.get("mediaLatitude"),
    mediaLongitude: formData.get("mediaLongitude"),
    originalSizeBytes: formData.get("originalSizeBytes") || undefined,
    optimizedSizeBytes: formData.get("optimizedSizeBytes") || undefined,
    optimizationStatus: formData.get("optimizationStatus") || "not_needed",
    usedForLocationSuggestion:
      formData.get("usedForLocationSuggestion") === "true",
    caption: String(formData.get("caption") ?? ""),
    mood: String(formData.get("mood") ?? ""),
    visibility: formData.get("visibility"),
    locationName: String(formData.get("locationName") ?? ""),
    locationLabel: String(formData.get("locationLabel") ?? ""),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationSource: formData.get("locationSource"),
    locationConfidence: formData.get("locationConfidence"),
    locationAccuracyMeters: formData.get("locationAccuracyMeters"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your Moment details.",
    };
  }

  const input = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await deleteR2Object(input.objectKey);

    return {
      success: false,
      message: "Please login again.",
    };
  }

  if (!input.objectKey.startsWith(`moments/${user.id}/`)) {
    await deleteR2Object(input.objectKey);

    return {
      success: false,
      message: "Invalid media ownership.",
    };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert({
      owner_id: user.id,
      caption: input.caption?.trim() || null,
      mood: input.mood?.trim() || null,
      location_name: input.locationLabel ?? input.locationName,
      location_label: input.locationLabel ?? input.locationName,
      latitude: input.latitude,
      longitude: input.longitude,
      location_source:
        input.latitude !== null && input.longitude !== null
          ? input.locationSource
          : "unknown",
      location_confidence: input.locationConfidence,
      location_accuracy_meters: input.locationAccuracyMeters,
      visibility: input.visibility,
      expires_at: expiresAt,
      is_archived: false,
      cleanup_status: "active",
    })
    .select("id")
    .single();

  if (momentError || !moment) {
    await deleteR2Object(input.objectKey);

    return {
      success: false,
      message: momentError?.message || "Unable to create Moment.",
    };
  }

  const { error: mediaError } = await supabase.from("moment_media").insert({
    moment_id: moment.id,
    owner_id: user.id,
    object_key: input.objectKey,
    public_url: input.publicUrl?.trim() || null,
    media_kind: input.mediaKind,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    width: input.width ?? null,
    height: input.height ?? null,
    duration_seconds: input.durationSeconds ?? null,
    latitude: input.mediaLatitude,
    longitude: input.mediaLongitude,
    location_source:
      input.mediaLatitude !== null && input.mediaLongitude !== null
        ? "media_gps"
        : "unknown",
    original_size_bytes: input.originalSizeBytes ?? input.sizeBytes,
    optimized_size_bytes: input.optimizedSizeBytes ?? input.sizeBytes,
    optimization_status: input.optimizationStatus,
    used_for_location_suggestion: input.usedForLocationSuggestion,
    display_order: 0,
    upload_status: "uploaded",
  });

  if (mediaError) {
    await supabase
      .from("moments")
      .delete()
      .eq("id", moment.id)
      .eq("owner_id", user.id);

    await deleteR2Object(input.objectKey);

    return {
      success: false,
      message: mediaError.message,
    };
  }

  revalidatePath("/home");
  revalidatePath("/create");
  revalidatePath("/create/moment");
  revalidatePath("/profile");
  await markContentDraftPublished({
    supabase,
    userId: user.id,
    draftId: formData.get("draftId"),
    publishedContentId: moment.id,
  });

  return {
    success: true,
    message: "Moment published.",
    momentId: moment.id,
  };
}

export async function editMomentAction(
  formData: FormData
): Promise<MomentActionState> {
  const parsed = EditMomentSchema.safeParse({
    momentId: formData.get("momentId"),
    caption: String(formData.get("caption") ?? ""),
    mood: String(formData.get("mood") ?? ""),
    visibility: formData.get("visibility"),
    locationName: String(formData.get("locationName") ?? ""),
    locationLabel: String(formData.get("locationLabel") ?? ""),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationSource: formData.get("locationSource"),
    locationConfidence: formData.get("locationConfidence"),
    locationAccuracyMeters: formData.get("locationAccuracyMeters"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your Moment details.",
    };
  }

  const input = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("id, owner_id, expires_at, is_archived, cleanup_status")
    .eq("id", input.momentId)
    .maybeSingle();

  if (momentError || !moment) {
    return {
      success: false,
      message: momentError?.message || "Moment not found.",
    };
  }

  if (moment.owner_id !== user.id) {
    return {
      success: false,
      message: "You can edit only your own Moment.",
    };
  }

  if (
    moment.is_archived ||
    moment.cleanup_status !== "active" ||
    new Date(moment.expires_at).getTime() <= Date.now()
  ) {
    return {
      success: false,
      message: "This Moment has expired and cannot be edited.",
    };
  }

  const { error } = await supabase
    .from("moments")
    .update({
      caption: input.caption?.trim() || null,
      mood: input.mood?.trim() || null,
      visibility: input.visibility,
      location_name: input.locationLabel ?? input.locationName,
      location_label: input.locationLabel ?? input.locationName,
      latitude: input.latitude,
      longitude: input.longitude,
      location_source:
        input.latitude !== null && input.longitude !== null
          ? input.locationSource
          : "unknown",
      location_confidence: input.locationConfidence,
      location_accuracy_meters: input.locationAccuracyMeters,
    })
    .eq("id", input.momentId)
    .eq("owner_id", user.id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath(`/moment/${input.momentId}`);
  revalidatePath(`/moment/${input.momentId}/edit`);
  revalidatePath(`/create/moment/${input.momentId}`);

  return {
    success: true,
    message: "Moment updated.",
    momentId: input.momentId,
  };
}

export async function markMomentViewedAction(
  momentId: string
): Promise<MomentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("id, owner_id, expires_at")
    .eq("id", momentId)
    .eq("is_archived", false)
    .maybeSingle();

  if (momentError || !moment) {
    return {
      success: false,
      message: momentError?.message || "Moment not found.",
    };
  }

  if (moment.owner_id === user.id) {
    return {
      success: true,
      message: "Owner view not counted.",
      momentId,
    };
  }

  if (new Date(moment.expires_at).getTime() <= Date.now()) {
    return {
      success: false,
      message: "This Moment has expired.",
    };
  }

  const { error } = await supabase.from("moment_views").upsert(
    {
      moment_id: momentId,
      viewer_id: user.id,
      viewed_at: new Date().toISOString(),
    },
    {
      onConflict: "moment_id,viewer_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/moment/${momentId}`);

  return {
    success: true,
    message: "Moment viewed.",
    momentId,
  };
}

export async function deleteMomentAction(
  momentId: string
): Promise<MomentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login again.",
    };
  }

  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("id, owner_id")
    .eq("id", momentId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (momentError || !moment) {
    return {
      success: false,
      message: momentError?.message || "Moment not found.",
    };
  }

  const { data: mediaRows } = await supabase
    .from("moment_media")
    .select("object_key")
    .eq("moment_id", momentId)
    .eq("owner_id", user.id);

  const objectKeys = (mediaRows ?? [])
    .map((row) => row.object_key as string | null)
    .filter(Boolean) as string[];

  for (const objectKey of objectKeys) {
    await deleteR2Object(objectKey);
  }

  const { error: deleteError } = await supabase
    .from("moments")
    .delete()
    .eq("id", momentId)
    .eq("owner_id", user.id);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/create/moment");
  revalidatePath(`/moment/${momentId}`);

  return {
    success: true,
    message: "Moment deleted.",
    momentId,
  };
}
