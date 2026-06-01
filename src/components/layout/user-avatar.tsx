"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/components/layout/layout-types";

type UserAvatarProps = {
  user: AppUser;
  size?: "sm" | "md";
};

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user.avatarUrl) {
      return;
    }

    const controller = new AbortController();

    async function loadAvatar() {
      try {
        const response = await fetch("/api/profile/me/avatar", {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          avatarUrl?: string | null;
        };

        if (data.avatarUrl) {
          setFetchedAvatarUrl(data.avatarUrl);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void loadAvatar();

    return () => {
      controller.abort();
    };
  }, [user.avatarUrl]);

  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  const sizeClass = size === "sm" ? "size-10 rounded-xl" : "size-11 rounded-2xl";
  const avatarUrl = user.avatarUrl ?? fetchedAvatarUrl;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user.fullName}
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
