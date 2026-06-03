import { NextResponse } from "next/server";
import { cleanupStaleDrafts } from "@/lib/drafts/cleanup-stale-drafts";
import { cleanupExpiredMoments } from "@/lib/moments/cleanup-expired-moments";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");

  return authHeader === `Bearer ${cronSecret}`;
}

async function handleCleanup(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized cleanup request.",
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const draftLimitParam = Number(url.searchParams.get("draftLimit") ?? limitParam);
  const draftRetentionParam = Number(
    url.searchParams.get("draftRetentionDays") ?? 30
  );
  const mode = url.searchParams.get("mode") ?? "hard";

  const moments = await cleanupExpiredMoments({
    limit: Number.isFinite(limitParam) ? limitParam : 50,
    hardDelete: mode !== "soft",
  });
  const drafts = await cleanupStaleDrafts({
    limit: Number.isFinite(draftLimitParam) ? draftLimitParam : 50,
    retentionDays: Number.isFinite(draftRetentionParam)
      ? draftRetentionParam
      : 30,
  });

  const result = {
    success: moments.success && drafts.success,
    moments,
    drafts,
  };

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

export async function GET(request: Request) {
  return handleCleanup(request);
}

export async function POST(request: Request) {
  return handleCleanup(request);
}
