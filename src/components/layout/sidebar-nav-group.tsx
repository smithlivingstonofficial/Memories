"use client";

import Link from "next/link";
import type { NavGroup, NavItem } from "@/components/layout/layout-types";
import { isActiveRoute } from "@/components/layout/route-utils";
import { cn } from "@/lib/utils";

type SidebarGroupProps = {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
};

export function SidebarGroup({
  group,
  pathname,
  collapsed,
}: SidebarGroupProps) {
  return (
    <div>
      {!collapsed ? (
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          {group.title}
        </p>
      ) : (
        <div className="mx-auto mb-3 h-px w-10 bg-[var(--app-border)]" />
      )}

      <div className={collapsed ? "space-y-2" : "space-y-1.5"}>
        {group.items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActiveRoute(pathname, item)}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <div className="group relative flex justify-center">
        <Link
          href={item.href}
          className={cn(
            "flex size-12 items-center justify-center rounded-[1.25rem] transition-all duration-200",
            active
              ? "bg-[var(--app-soft)] text-[var(--app-accent)] shadow-[0_14px_34px_rgba(99,102,241,0.16)]"
              : "text-[var(--app-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] hover:shadow-sm"
          )}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={active ? 2.2 : 1.9} />
        </Link>

        <div className="pointer-events-none absolute left-[58px] top-1/2 z-50 -translate-y-1/2 translate-x-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] opacity-0 shadow-[0_18px_40px_var(--app-shadow)] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          {item.label}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all",
        active
          ? "bg-[var(--app-soft)] text-[var(--app-accent)]"
          : "text-[var(--app-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={19} />
      <span>{item.label}</span>
    </Link>
  );
}