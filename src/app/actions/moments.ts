"use server";

import { revalidatePath } from "next/cache";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

const OptimizationStatusSchema = z.enum([
  "not_needed",
  "optimized",
  "skipped",
  "failed",
]);

const BooleanStringSchema = z.preprocess((value) => {
  return value === true || value === "true";
}, z.boolean());

const CreateMomentSchema = z.object({
  media: z
    .array(
      z.object({
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
      })
    )
    .min(1)
    .max(10),
  caption: z.string().trim().min(1).max(120),
  visibility: z.enum(["public", "followers", "inner_circle"]),
});

const EditMomentSchema = z.object({
  momentId: z.string().uuid(),
  caption: z.string().trim().min(1).max(120),
  visibility: z.enum(["public", "followers", "inner_circle"]),
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

function isRlsViolation(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42501" ||
    error?.message?.toLowerCase().includes("row-level security") === true
  );
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

async function deleteR2Objects(objectKeys: string[]) {
  await Promise.all(objectKeys.map((objectKey) => deleteR2Object(objectKey)));
}

function parseMomentMedia(formData: FormData) {
  const raw = formData.get("media");

  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  const objectKey = formData.get("objectKey");
  if (!objectKey) return null;

  return [
    {
      objectKey,
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
    },
  ];
}

export async function createMomentAction(
  formData: FormData
): Promise<MomentActionState> {
  const parsed = CreateMomentSchema.safeParse({
    media: parseMomentMedia(formData),
    caption: String(formData.get("caption") ?? ""),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your Moment details.",
    };
  }

  const input = parsed.data;
  const objectKeys = input.media.map((item) => item.objectKey);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await deleteR2Objects(objectKeys);

    return {
      success: false,
      message: "Please login again.",
    };
  }

  if (
    input.media.some(
      (media) => !media.objectKey.startsWith(`moments/${user.id}/`)
    )
  ) {
    await deleteR2Objects(objectKeys);

    return {
      success: false,
      message: "Invalid media ownership.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    await deleteR2Objects(objectKeys);

    return {
      success: false,
      message: "Complete your profile before creating Moments.",
    };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const momentInsert = {
    owner_id: user.id,
    caption: input.caption.trim(),
    mood: null,
    location_name: null,
    location_label: null,
    latitude: null,
    longitude: null,
    location_source: "unknown",
    location_confidence: null,
    location_accuracy_meters: null,
    visibility: input.visibility,
    expires_at: expiresAt,
    is_archived: false,
    cleanup_status: "active",
  };

  let { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert(momentInsert)
    .select("id")
    .single();

  if (isRlsViolation(momentError)) {
    try {
      const adminSupabase = createAdminClient();
      const adminResult = await adminSupabase
        .from("moments")
        .insert(momentInsert)
        .select("id")
        .single();

      moment = adminResult.data;
      momentError = adminResult.error;
    } catch {
      // Keep the original authenticated-client RLS error below.
    }
  }

  if (momentError || !moment) {
    await deleteR2Objects(objectKeys);

    return {
      success: false,
      message: momentError?.message || "Unable to create Moment.",
    };
  }

  const mediaInsert = input.media.map((media, index) => ({
    moment_id: moment.id,
    owner_id: user.id,
    object_key: media.objectKey,
    public_url: media.publicUrl?.trim() || null,
    media_kind: media.mediaKind,
    mime_type: media.mimeType,
    size_bytes: media.sizeBytes,
    width: media.width ?? null,
    height: media.height ?? null,
    duration_seconds: media.durationSeconds ?? null,
    latitude: media.mediaLatitude,
    longitude: media.mediaLongitude,
    location_source:
      media.mediaLatitude !== null && media.mediaLongitude !== null
        ? "media_gps"
        : "unknown",
    original_size_bytes: media.originalSizeBytes ?? media.sizeBytes,
    optimized_size_bytes: media.optimizedSizeBytes ?? media.sizeBytes,
    optimization_status: media.optimizationStatus,
    used_for_location_suggestion: media.usedForLocationSuggestion,
    display_order: index,
    upload_status: "uploaded",
  }));

  let { error: mediaError } = await supabase
    .from("moment_media")
    .insert(mediaInsert);

  if (isRlsViolation(mediaError)) {
    try {
      const adminSupabase = createAdminClient();
      const adminResult = await adminSupabase
        .from("moment_media")
        .insert(mediaInsert);

      mediaError = adminResult.error;
    } catch {
      // Keep the original authenticated-client RLS error below.
    }
  }

  if (mediaError) {
    await supabase
      .from("moments")
      .delete()
      .eq("id", moment.id)
      .eq("owner_id", user.id);

    await deleteR2Objects(objectKeys);

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
    visibility: formData.get("visibility"),
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
      caption: input.caption.trim(),
      mood: null,
      visibility: input.visibility,
      location_name: null,
      location_label: null,
      latitude: null,
      longitude: null,
      location_source: "unknown",
      location_confidence: null,
      location_accuracy_meters: null,
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
