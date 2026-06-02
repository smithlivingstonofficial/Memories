import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { R2_BUCKET, R2_PUBLIC_URL, r2Client } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function getMediaKind(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { message: "Unauthorized request." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const fileName = String(body.fileName || "");
    const fileType = String(body.fileType || "");
    const fileSize = Number(body.fileSize || 0);
    const originalFileSize = Number(body.originalFileSize || fileSize);
    const optimizedFileSize = Number(body.optimizedFileSize || fileSize);
    const purpose = String(body.purpose || "memory");
    const visibility = String(body.visibility || "private");
    const latitude =
      typeof body.latitude === "number" && Number.isFinite(body.latitude)
        ? body.latitude
        : null;
    const longitude =
      typeof body.longitude === "number" && Number.isFinite(body.longitude)
        ? body.longitude
        : null;
    const optimizationStatus = String(
      body.optimizationStatus || "not_needed"
    );
    const usedForLocationSuggestion = Boolean(body.usedForLocationSuggestion);

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { message: "Missing file information." },
        { status: 400 }
      );
    }

    if (!(fileType in allowedTypes)) {
      return NextResponse.json(
        { message: "Unsupported file type." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File is too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    if (
      !["profile_avatar", "profile_cover", "memory", "moment", "vault"].includes(
        purpose
      )
    ) {
      return NextResponse.json(
        { message: "Invalid upload purpose." },
        { status: 400 }
      );
    }

    if (!["private", "inner_circle", "public"].includes(visibility)) {
      return NextResponse.json(
        { message: "Invalid visibility." },
        { status: 400 }
      );
    }

    if (
      !["not_needed", "optimized", "skipped", "failed"].includes(
        optimizationStatus
      )
    ) {
      return NextResponse.json(
        { message: "Invalid optimization status." },
        { status: 400 }
      );
    }

    const extension = allowedTypes[fileType as keyof typeof allowedTypes];
    const objectKey = `users/${user.id}/${purpose}/${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 60,
    });

    const publicUrl =
      visibility === "public" && R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${objectKey}`
        : null;

    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .insert({
        owner_id: user.id,
        bucket: R2_BUCKET,
        object_key: objectKey,
        public_url: publicUrl,
        file_name: fileName,
        mime_type: fileType,
        size_bytes: fileSize,
        original_size_bytes: originalFileSize,
        optimized_size_bytes: optimizedFileSize,
        optimization_status: optimizationStatus,
        latitude,
        longitude,
        location_source:
          latitude !== null && longitude !== null ? "media_gps" : "unknown",
        used_for_location_suggestion: usedForLocationSuggestion,
        media_kind: getMediaKind(fileType),
        purpose,
        visibility,
        upload_status: "pending",
      })
      .select("id, object_key, public_url")
      .single();

    if (assetError) {
      return NextResponse.json(
        { message: assetError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl,
      assetId: asset.id,
      objectKey: asset.object_key,
      publicUrl: asset.public_url,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to create upload URL." },
      { status: 500 }
    );
  }
}
