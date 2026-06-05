"use client";

import dynamic from "next/dynamic";
import type { MemoryMapItem } from "@/lib/map/get-memory-map-data";

const MemoryMap = dynamic(
  () => import("@/components/map/memory-map").then((mod) => mod.MemoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-[var(--app-bg)] text-sm font-semibold text-[var(--app-muted)]">
        Loading map...
      </div>
    ),
  }
);

export function MemoryMapDynamic({ memories }: { memories: MemoryMapItem[] }) {
  return <MemoryMap memories={memories} />;
}
