import "server-only";

import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";

type StaleDraftRow = {
  id: string;
};

type DraftMediaRow = {
  id: string;
  draft_id: string;
  object_key: string | null;
};

export type DraftCleanupResult = {
  success: boolean;
  message: string;
  selectedDrafts: number;
  deletedObjects: number;
  failedObjects: number;
};

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

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function deleteR2Objects(objectKeys: string[]) {
  const uniqueKeys = Array.from(new Set(objectKeys.filter(Boolean)));

  if (uniqueKeys.length === 0) {
    return {
      deletedObjects: 0,
      failedObjects: 0,
    };
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET;

  if (!bucket) {
    throw new Error("Cloudflare R2 bucket is missing.");
  }

  const client = getR2Client();
  let deletedObjects = 0;
  let failedObjects = 0;

  for (const batch of chunkArray(uniqueKeys, 1000)) {
    const response = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((key) => ({
            Key: key,
          })),
          Quiet: true,
        },
      })
    );

    const errors = response.Errors ?? [];

    failedObjects += errors.length;
    deletedObjects += batch.length - errors.length;

    if (errors.length > 0) {
      const firstError = errors[0];
      throw new Error(
        `R2 draft cleanup failed for ${errors.length} object(s). First error: ${
          firstError.Message ?? firstError.Code ?? "Unknown R2 error"
        }`
      );
    }
  }

  return {
    deletedObjects,
    failedObjects,
  };
}

export async function cleanupStaleDrafts({
  limit = 50,
  retentionDays = 30,
}: {
  limit?: number;
  retentionDays?: number;
} = {}): Promise<DraftCleanupResult> {
  const supabase = createAdminClient();
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const safeRetentionDays = Math.min(Math.max(retentionDays, 1), 365);
  const cutoff = new Date(
    Date.now() - safeRetentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: staleDraftsData, error: staleDraftsError } = await supabase
    .from("content_drafts")
    .select("id")
    .in("status", ["active", "discarded"])
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(safeLimit);

  if (staleDraftsError) {
    throw new Error(staleDraftsError.message);
  }

  const staleDrafts = (staleDraftsData ?? []) as StaleDraftRow[];

  if (staleDrafts.length === 0) {
    return {
      success: true,
      message: "No stale drafts found.",
      selectedDrafts: 0,
      deletedObjects: 0,
      failedObjects: 0,
    };
  }

  const draftIds = staleDrafts.map((draft) => draft.id);

  const { data: mediaRowsData, error: mediaRowsError } = await supabase
    .from("content_draft_media")
    .select("id, draft_id, object_key")
    .in("draft_id", draftIds)
    .neq("upload_status", "deleted");

  if (mediaRowsError) {
    throw new Error(mediaRowsError.message);
  }

  const mediaRows = (mediaRowsData ?? []) as DraftMediaRow[];
  const objectKeys = mediaRows
    .map((row) => row.object_key)
    .filter(Boolean) as string[];

  try {
    const r2Result = await deleteR2Objects(objectKeys);

    if (mediaRows.length > 0) {
      const { error: mediaUpdateError } = await supabase
        .from("content_draft_media")
        .update({
          upload_status: "deleted",
        })
        .in(
          "id",
          mediaRows.map((row) => row.id)
        );

      if (mediaUpdateError) {
        throw new Error(mediaUpdateError.message);
      }
    }

    const { error: draftUpdateError } = await supabase
      .from("content_drafts")
      .update({
        status: "discarded",
      })
      .in("id", draftIds);

    if (draftUpdateError) {
      throw new Error(draftUpdateError.message);
    }

    return {
      success: true,
      message: "Stale draft media deleted and drafts discarded.",
      selectedDrafts: staleDrafts.length,
      deletedObjects: r2Result.deletedObjects,
      failedObjects: r2Result.failedObjects,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Draft cleanup failed.";

    return {
      success: false,
      message,
      selectedDrafts: staleDrafts.length,
      deletedObjects: 0,
      failedObjects: objectKeys.length,
    };
  }
}
