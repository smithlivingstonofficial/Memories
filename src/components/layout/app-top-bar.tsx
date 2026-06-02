"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { UserAvatar } from "@/components/layout/user-avatar";
import type { AppUser } from "@/components/layout/layout-types";

type AppTopBarProps = {
  user: AppUser;
};

export function AppTopBar({ user }: AppTopBarProps) {

  return (
    <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)]/95 backdrop-blur-2xl lg:hidden">
      {/* Mobile Top Navbar */}
      <div className="flex h-20 items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:hidden">
        <Link
          href="/home"
          className="flex min-w-0 items-center gap-3 rounded-2xl pr-2 transition active:scale-[0.99]"
          aria-label="Go to home"
        >
          <BrandLogo className="size-11 rounded-[1.2rem]" priority />

          <h1 className="font-brand truncate text-2xl font-semibold leading-none tracking-[-0.06em] text-[var(--app-text)]">
            Memories
          </h1>
        </Link>

        <Link
          href="/profile"
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-1.5 shadow-sm transition active:scale-95"
          aria-label="Open profile"
        >
          <UserAvatar user={user} size="sm" />
        </Link>
      </div>
    </header>
  );
}
