"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
        collapsed ? "w-[86px] px-3 py-5" : "w-[292px] p-4"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center",
          collapsed ? "flex-col gap-4" : "justify-between gap-3"
        )}
      >
        <Link
          href="/home"
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-[var(--app-accent)] text-white shadow-[0_18px_40px_rgba(99,102,241,0.25)]">
            <Sparkles size={22} />
          </div>

          {!collapsed && (
            <div>
              <p className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Memories
              </p>
              <p className="text-xs text-[var(--app-muted)]">
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

      <nav
        className={cn(
          "no-scrollbar min-h-0 flex-1 overflow-y-auto",
          collapsed ? "mt-8 space-y-5" : "mt-7 space-y-6"
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

      <div
        className={cn(
          "shrink-0 border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[0_18px_50px_var(--app-shadow)]",
          collapsed
            ? "mx-auto mt-4 flex size-14 items-center justify-center rounded-[1.35rem]"
            : "mt-4 rounded-[1.5rem] p-4"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <UserAvatar user={user} />

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                @{user.username}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}