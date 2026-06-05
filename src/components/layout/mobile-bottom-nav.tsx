"use client";

import Link from "next/link";
import { Menu as MenuIcon, Plus } from "lucide-react";
import { mobilePrimaryNavItems } from "@/components/layout/navigation-config";
import { isActiveRoute } from "@/components/layout/route-utils";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  pathname: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
};

export function MobileBottomNav({
  pathname,
  menuOpen,
  onOpenMenu,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100dvw-10px)] max-w-[460px] -translate-x-1/2 rounded-[2rem] border border-[var(--app-border)] bg-[linear-gradient(135deg,var(--app-surface-strong),var(--app-surface))] px-2 pb-2 pt-2.5 shadow-[0_26px_90px_var(--app-shadow),0_10px_32px_rgba(99,102,241,0.16)] backdrop-blur-2xl sm:bottom-4 sm:w-[calc(100dvw-18px)] lg:hidden">
      <div className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-8 bottom-1 h-8 rounded-full bg-[var(--app-soft)] opacity-40 blur-2xl" />
      <div className="pointer-events-none absolute left-1/2 top-2 size-[82px] -translate-x-1/2 rounded-full bg-[var(--app-accent)] opacity-10 blur-xl" />

      <div className="grid h-[58px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px_minmax(0,1fr)_minmax(0,1fr)] items-end gap-1">
      {mobilePrimaryNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveRoute(pathname, item);
        const isCreate = item.href === "/create";

        if (isCreate) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative mx-auto -mt-8 flex size-[68px] shrink-0 items-center justify-center self-start rounded-full bg-[linear-gradient(135deg,#A5B4FC,var(--app-accent)_52%,var(--app-accent-active))] text-white shadow-[0_20px_48px_rgba(99,102,241,0.42),inset_0_1px_0_rgba(255,255,255,0.36)] ring-[7px] ring-[var(--app-surface-strong)] transition hover:scale-[1.03] hover:bg-[var(--app-accent-hover)] active:scale-95"
              aria-label="Create"
              aria-current={active ? "page" : undefined}
            >
              <span className="absolute inset-1 rounded-full border border-white/25" />
              <span className="absolute inset-x-4 top-2 h-2 rounded-full bg-white/35 blur-sm" />
              <Plus size={31} strokeWidth={2.35} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex min-w-0 flex-col items-center justify-center rounded-[1.35rem] px-1 py-2 transition-all",
              active
                ? "text-[var(--app-accent)]"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <span className="absolute inset-x-1 bottom-1 top-1 rounded-[1.35rem] bg-[var(--app-soft)] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14),0_10px_24px_rgba(99,102,241,0.16)]" />
            )}
            <span
              className={cn(
                "relative flex size-10 items-center justify-center rounded-[1.1rem] transition",
                active
                  ? "bg-[rgba(99,102,241,0.16)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                  : "group-hover:bg-[var(--app-surface-soft)] group-hover:shadow-[inset_0_0_0_1px_var(--app-border)]"
              )}
            >
              <Icon size={21} strokeWidth={2.2} />
            </span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        className={cn(
          "group relative flex min-w-0 flex-col items-center justify-center rounded-[1.35rem] px-1 py-2 transition-all",
          menuOpen
            ? "text-[var(--app-accent)]"
            : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
        )}
        aria-label="Open menu"
        aria-expanded={menuOpen}
      >
        {menuOpen && (
          <span className="absolute inset-x-1 bottom-1 top-1 rounded-[1.35rem] bg-[var(--app-soft)] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14),0_10px_24px_rgba(99,102,241,0.16)]" />
        )}
        <span
          className={cn(
            "relative flex size-10 items-center justify-center rounded-[1.1rem] transition",
            menuOpen
              ? "bg-[rgba(99,102,241,0.16)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
              : "group-hover:bg-[var(--app-surface-soft)] group-hover:shadow-[inset_0_0_0_1px_var(--app-border)]"
          )}
        >
          <MenuIcon size={21} strokeWidth={2.2} />
        </span>
      </button>
      </div>
    </nav>
  );
}
