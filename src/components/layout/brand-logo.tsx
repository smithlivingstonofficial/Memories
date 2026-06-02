"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative block size-12 shrink-0 overflow-hidden rounded-[1.25rem]",
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/Memories Light.png"
        alt=""
        fill
        sizes="48px"
        className="theme-logo-light object-cover"
        priority={priority}
      />
      <Image
        src="/Memories Dark.png"
        alt=""
        fill
        sizes="48px"
        className="theme-logo-dark object-cover"
        priority={priority}
      />
    </span>
  );
}
