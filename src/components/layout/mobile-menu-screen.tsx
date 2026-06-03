"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Camera, PenLine, Sparkles, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { mobileMenuGroups } from "@/components/layout/navigation-config";
import { isActiveRoute } from "@/components/layout/route-utils";
import { UserAvatar } from "@/components/layout/user-avatar";
import type { AppUser } from "@/components/layout/layout-types";
import { cn } from "@/lib/utils";

type MobileMenuScreenProps = {
  onClose: () => void;
  pathname: string;
  user: AppUser;
};

export function MobileMenuScreen({
  onClose,
  pathname,
  user,
}: MobileMenuScreenProps) {
  return (
    <div className="mem-bg fixed inset-0 z-[90] lg:hidden">
      <div className="pointer-events-none absolute inset-0 mem-page-gradient" />

      <div className="relative flex h-dvh flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 backdrop-blur-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar user={user} />

            <div className="min-w-0">
              <p className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Menu
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                @{user.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
          <div className="mb-4 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-[0_18px_50px_var(--app-shadow)]">
            <div className="flex items-center gap-3">
              <BrandLogo className="size-11 rounded-2xl" />

              <div className="min-w-0 flex-1">
                <p className="font-brand truncate text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                  Memories
                </p>
                <p className="truncate text-xs text-[var(--app-muted)]">
                  Private-first space
                </p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-accent)]">
                <Sparkles size={12} />
                App
              </span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <QuickMenuLink
              href="/create/memory"
              icon={PenLine}
              label="Write Memory"
              onClose={onClose}
            />

            <QuickMenuLink
              href="/create/moment"
              icon={Camera}
              label="Quick Moment"
              onClose={onClose}
            />
          </div>

          <div className="space-y-4">
            {mobileMenuGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-2"
              >
                <p className="mb-2 px-3 pt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                  {group.title}
                </p>

                <div className="grid gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-[1.2rem] p-2.5 transition",
                          active
                            ? "bg-[var(--app-soft)] text-[var(--app-accent)]"
                            : "text-[var(--app-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl transition",
                            active
                              ? "bg-[rgba(99,102,241,0.16)]"
                              : "bg-[var(--app-soft)] group-hover:bg-[var(--app-soft)]"
                          )}
                        >
                          <Icon size={17} />
                        </div>

                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className="rounded-full bg-[var(--app-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-accent)]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickMenuLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.22)] transition active:scale-95"
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}
