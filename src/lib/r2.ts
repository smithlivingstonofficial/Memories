// src/lib/r2.ts

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function createSignedReadUrl(
  objectKey: string,
  expiresInSeconds = 300
) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });
}