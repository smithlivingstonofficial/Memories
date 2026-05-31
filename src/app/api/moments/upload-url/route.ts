import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UploadUrlBody = {
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  mediaKind?: "image" | "video";
};

const MAX_FILE_SIZE = 120 * 1024 * 1024;

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing.");
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

function sanitizeFileName(fileName: string) {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-90);

  return safeName || "moment-media";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "Please login again.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UploadUrlBody;

    const fileName = String(body.fileName ?? "");
    const contentType = String(body.contentType ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const mediaKind = body.mediaKind;

    if (!fileName || !contentType || !mediaKind) {
      return NextResponse.json(
        {
          message: "Missing upload details.",
        },
        { status: 400 }
      );
    }

    if (mediaKind !== "image" && mediaKind !== "video") {
      return NextResponse.json(
        {
          message: "Only image or video Moments are allowed.",
        },
        { status: 400 }
      );
    }

    if (mediaKind === "image" && !contentType.startsWith("image/")) {
      return NextResponse.json(
        {
          message: "Selected file is not a valid image.",
        },
        { status: 400 }
      );
    }

    if (mediaKind === "video" && !contentType.startsWith("video/")) {
      return NextResponse.json(
        {
          message: "Selected file is not a valid video.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json(
        {
          message: "Invalid file size.",
        },
        { status: 400 }
      );
    }

    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Moment media should be less than 120 MB.",
        },
        { status: 400 }
      );
    }

    const bucket = process.env.CLOUDFLARE_R2_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        {
          message: "Cloudflare R2 bucket is missing.",
        },
        { status: 500 }
      );
    }

    const dateFolder = new Date().toISOString().slice(0, 10);
    const objectKey = `moments/${user.id}/${dateFolder}/${crypto.randomUUID()}-${sanitizeFileName(
      fileName
    )}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: 60 * 5,
    });

    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(
      /\/$/,
      ""
    );

    const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : null;

    return NextResponse.json({
      uploadUrl,
      objectKey,
      publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create upload URL.",
      },
      { status: 500 }
    );
  }
}