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
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-between rounded-[1.7rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2 shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl lg:hidden">
      {mobilePrimaryNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveRoute(pathname, item);
        const isCreate = item.href === "/create";

        if (isCreate) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="mx-1 -mt-8 flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-white shadow-[0_18px_38px_rgba(99,102,241,0.35)] transition active:scale-95"
              aria-label="Create"
              aria-current={active ? "page" : undefined}
            >
              <Plus size={28} strokeWidth={2.4} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-[1.2rem] py-2 text-[11px] font-medium transition-all",
              active
                ? "bg-[var(--app-soft)] text-[var(--app-accent)]"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-[1.2rem] py-2 text-[11px] font-medium transition-all",
          menuOpen
            ? "bg-[var(--app-soft)] text-[var(--app-accent)]"
            : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
        )}
        aria-label="Open menu"
        aria-expanded={menuOpen}
      >
        <MenuIcon size={19} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
