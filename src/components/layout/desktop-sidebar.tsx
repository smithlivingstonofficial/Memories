"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { desktopNavGroups } from "@/components/layout/navigation-config";
import { SidebarGroup } from "@/components/layout/sidebar-nav-group";
import { UserAvatar } from "@/components/layout/user-avatar";
import type { AppUser } from "@/components/layout/layout-types";
import { cn } from "@/lib/utils";

type DesktopSidebarProps = {
  user: AppUser;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
};

export function DesktopSidebar({
  user,
  pathname,
  collapsed,
  onToggle,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 border-r border-[var(--app-border)] bg-[var(--app-surface)] shadow-[18px_0_60px_var(--app-shadow)] backdrop-blur-2xl transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[86px] px-3 py-5" : "w-[304px] p-4"
      )}
    >
      <div
        className={cn(
          "shrink-0",
          collapsed
            ? "flex flex-col items-center gap-4"
            : "rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "flex-col gap-4" : "justify-between gap-3")}>
          <Link
            href="/home"
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "min-w-0 gap-3"
            )}
            aria-label="Go to home"
          >
            <BrandLogo priority />

            {!collapsed && (
              <div className="min-w-0">
                <p className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Memories
                </p>
                <p className="truncate text-xs text-[var(--app-muted)]">
                  Private-first space
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex shrink-0 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-text)]",
              collapsed ? "size-9 rounded-2xl" : "size-10 rounded-2xl"
            )}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* {!collapsed && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[var(--app-soft)] px-3 py-2 text-xs font-semibold text-[var(--app-accent)]">
            <Sparkles size={14} />
            Your private memory workspace
          </div>
        )} */}
      </div>

      <nav
        className={cn(
          "no-scrollbar min-h-0 flex-1 overflow-y-auto",
          collapsed ? "mt-8 space-y-5" : "mt-5 space-y-4"
        )}
      >
        {desktopNavGroups.map((group) => (
          <SidebarGroup
            key={group.title}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <Link
        href="/profile"
        className={cn(
          "shrink-0 border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[0_18px_50px_var(--app-shadow)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-soft)]",
          collapsed
            ? "mx-auto mt-4 flex size-14 items-center justify-center rounded-[1.35rem]"
            : "mt-4 rounded-[1.5rem] p-3"
        )}
        aria-label="Open profile"
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <UserAvatar user={user} />

          {!collapsed && (
            <div>
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                @{user.username}
              </p>
            </div>
          )}
        </div>
      </Link>
    </aside>
  );
}
