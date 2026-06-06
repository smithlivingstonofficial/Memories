"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/components/layout/layout-types";

type UserAvatarProps = {
  user: AppUser;
  size?: "sm" | "md";
};

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  const sizeClass = size === "sm" ? "size-10 rounded-xl" : "size-11 rounded-2xl";

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.fullName}
        width={size === "sm" ? 40 : 44}
        height={size === "sm" ? 40 : 44}
        sizes={size === "sm" ? "40px" : "44px"}
        unoptimized
        className={cn(sizeClass, "shrink-0 object-cover")}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]"
      )}
    >
      {initials}
    </div>
  );
}
