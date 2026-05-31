import "server-only";

import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";

type ExpiredMomentRow = {
  id: string;
  owner_id: string;
};

type MomentMediaRow = {
  id: string;
  moment_id: string;
  object_key: string | null;
};

export type MomentCleanupResult = {
  success: boolean;
  message: string;
  selectedMoments: number;
  deletedMoments: number;
  deletedObjects: number;
  failedObjects: number;
  mode: "hard_delete" | "soft_archive";
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

  const batches = chunkArray(uniqueKeys, 1000);

  for (const batch of batches) {
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
        `R2 cleanup failed for ${errors.length} object(s). First error: ${
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

export async function cleanupExpiredMoments({
  limit = 50,
  hardDelete = true,
}: {
  limit?: number;
  hardDelete?: boolean;
} = {}): Promise<MomentCleanupResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const { data: expiredMoments, error: expiredError } = await supabase
    .from("moments")
    .select("id, owner_id")
    .lte("expires_at", now)
    .eq("is_archived", false)
    .in("cleanup_status", ["active", "failed"])
    .order("expires_at", { ascending: true })
    .limit(safeLimit);

  if (expiredError) {
    throw new Error(expiredError.message);
  }

  const momentRows = (expiredMoments ?? []) as ExpiredMomentRow[];

  if (momentRows.length === 0) {
    return {
      success: true,
      message: "No expired Moments found.",
      selectedMoments: 0,
      deletedMoments: 0,
      deletedObjects: 0,
      failedObjects: 0,
      mode: hardDelete ? "hard_delete" : "soft_archive",
    };
  }

  const momentIds = momentRows.map((moment) => moment.id);

  const { error: queueError } = await supabase
    .from("moments")
    .update({
      cleanup_status: "queued",
      cleanup_error: null,
      is_archived: true,
      updated_at: now,
    })
    .in("id", momentIds);

  if (queueError) {
    throw new Error(queueError.message);
  }

  const { data: mediaRowsData, error: mediaError } = await supabase
    .from("moment_media")
    .select("id, moment_id, object_key")
    .in("moment_id", momentIds)
    .neq("upload_status", "deleted");

  if (mediaError) {
    await supabase
      .from("moments")
      .update({
        cleanup_status: "failed",
        cleanup_error: mediaError.message,
        updated_at: new Date().toISOString(),
      })
      .in("id", momentIds);

    throw new Error(mediaError.message);
  }

  const mediaRows = (mediaRowsData ?? []) as MomentMediaRow[];
  const objectKeys = mediaRows
    .map((row) => row.object_key)
    .filter(Boolean) as string[];

  try {
    const r2Result = await deleteR2Objects(objectKeys);

    if (hardDelete) {
      const { error: deleteError } = await supabase
        .from("moments")
        .delete()
        .in("id", momentIds);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return {
        success: true,
        message: "Expired Moments and R2 media deleted.",
        selectedMoments: momentRows.length,
        deletedMoments: momentRows.length,
        deletedObjects: r2Result.deletedObjects,
        failedObjects: r2Result.failedObjects,
        mode: "hard_delete",
      };
    }

    const { error: mediaUpdateError } = await supabase
      .from("moment_media")
      .update({
        upload_status: "deleted",
      })
      .in("moment_id", momentIds);

    if (mediaUpdateError) {
      throw new Error(mediaUpdateError.message);
    }

    const { error: momentUpdateError } = await supabase
      .from("moments")
      .update({
        cleanup_status: "deleted",
        cleanup_error: null,
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .in("id", momentIds);

    if (momentUpdateError) {
      throw new Error(momentUpdateError.message);
    }

    return {
      success: true,
      message: "Expired Moment media deleted and Moments archived.",
      selectedMoments: momentRows.length,
      deletedMoments: 0,
      deletedObjects: r2Result.deletedObjects,
      failedObjects: r2Result.failedObjects,
      mode: "soft_archive",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Moment cleanup failed.";

    await supabase
      .from("moments")
      .update({
        cleanup_status: "failed",
        cleanup_error: message,
        updated_at: new Date().toISOString(),
      })
      .in("id", momentIds);

    return {
      success: false,
      message,
      selectedMoments: momentRows.length,
      deletedMoments: 0,
      deletedObjects: 0,
      failedObjects: objectKeys.length,
      mode: hardDelete ? "hard_delete" : "soft_archive",
    };
  }
}