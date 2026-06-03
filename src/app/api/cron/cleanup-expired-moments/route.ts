import { NextResponse } from "next/server";
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
  const mode = url.searchParams.get("mode") ?? "hard";

  const result = await cleanupExpiredMoments({
    limit: Number.isFinite(limitParam) ? limitParam : 50,
    hardDelete: mode !== "soft",
  });

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
