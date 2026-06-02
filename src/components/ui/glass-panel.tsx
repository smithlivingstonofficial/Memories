import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export const glassStyles = "rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl";

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(glassStyles, className)}
      {...props}
    />
  );
}
