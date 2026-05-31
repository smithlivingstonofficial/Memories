"use client";

import { useEffect } from "react";
import { markMomentViewedAction } from "@/app/actions/moments";

type MarkMomentViewedProps = {
  momentId: string;
  isOwner: boolean;
};

export function MarkMomentViewed({
  momentId,
  isOwner,
}: MarkMomentViewedProps) {
  useEffect(() => {
    if (isOwner) return;

    void markMomentViewedAction(momentId);
  }, [momentId, isOwner]);

  return null;
}