"use client";

import Link from "next/link";
import { ElementType, ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  LockKeyhole,
  PenLine,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: ReactNode;
  user: {
    fullName: string;
    username: string;
    avatarUrl?: string | null;
  };
};

type NavItem = {
  label: string;
  href: string;
  icon: ElementType;
};

const mainNavItems: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Create", href: "/create", icon: PenLine },
  { label: "Vault", href: "/vault", icon: LockKeyhole },
  { label: "Profile", href: "/profile", icon: User },
];

const secondaryNavItems: NavItem[] = [
  { label: "Keepsakes", href: "/keepsakes", icon: Bookmark },
  { label: "Inner Circle", href: "/inner-circle", icon: Users },
  { label: "Requests", href: "/requests", icon: UserCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

const SIDEBAR_STORAGE_KEY = "memories-sidebar-collapsed";

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setSidebarCollapsed(storedValue === "true");
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const nextValue = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  return (
    <div className="mem-bg relative h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mem-page-gradient" />

      <div className="relative flex h-full">
        <aside
          className={cn(
            "hidden h-full shrink-0 border-r border-[var(--app-border)] bg-[var(--app-surface)] shadow-[18px_0_60px_var(--app-shadow)] backdrop-blur-2xl transition-all duration-300 lg:flex lg:flex-col",
            sidebarCollapsed ? "w-[86px] px-3 py-5" : "w-[280px] p-4"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              sidebarCollapsed ? "flex-col gap-4" : "justify-between gap-3"
            )}
          >
            <Link
              href="/home"
              className={cn(
                "flex items-center",
                sidebarCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-[var(--app-accent)] text-white shadow-[0_18px_40px_rgba(99,102,241,0.25)]">
                <Sparkles size={22} />
              </div>

              {!sidebarCollapsed && (
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
              onClick={toggleSidebar}
              className={cn(
                "flex shrink-0 items-center justify-center border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-text)]",
                sidebarCollapsed
                  ? "size-9 rounded-2xl"
                  : "size-10 rounded-2xl"
              )}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>

          <div
            className={cn(
              "flex-1",
              sidebarCollapsed ? "mt-9 space-y-3" : "mt-8 space-y-2"
            )}
          >
            {mainNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActiveRoute(pathname, item.href)}
                collapsed={sidebarCollapsed}
              />
            ))}

            <div
              className={cn(
                "bg-[var(--app-border)]",
                sidebarCollapsed ? "mx-auto my-6 h-px w-10" : "my-5 h-px w-full"
              )}
            />

            {secondaryNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActiveRoute(pathname, item.href)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>

          <div
            className={cn(
              "border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[0_18px_50px_var(--app-shadow)]",
              sidebarCollapsed
                ? "mx-auto flex size-14 items-center justify-center rounded-[1.35rem]"
                : "rounded-[1.5rem] p-4"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                sidebarCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <Avatar user={user} />

              {!sidebarCollapsed && (
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

        <main className="flex h-full min-w-0 flex-1 flex-col">
          <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--app-muted)]">
                Cherish • Reflect • Remember
              </p>

              <h1 className="font-brand truncate text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-2xl">
                Good evening, {user.fullName.split(" ")[0]}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/search"
                className="hidden h-11 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-medium text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-text)] sm:flex"
              >
                <Search size={17} />
                Search
              </Link>

              <ThemeToggle />

              <Link
                href="/notifications"
                className="flex size-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-text)]"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>

              <Link href="/profile" className="lg:hidden">
                <Avatar user={user} />
              </Link>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-[112px] pt-4 sm:px-6 lg:px-8 lg:pb-8">
            {children}
          </section>
        </main>

        <MobileBottomNav pathname={pathname} />
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
        "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all",
        active
          ? "bg-[var(--app-soft)] text-[var(--app-accent)]"
          : "text-[var(--app-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]"
      )}
    >
      <Icon size={19} />
      <span>{item.label}</span>
    </Link>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-between rounded-[1.7rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2 shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl lg:hidden">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveRoute(pathname, item.href);
        const isCreate = item.href === "/create";

        if (isCreate) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-1 -mt-8 flex size-[60px] shrink-0 items-center justify-center rounded-2xl shadow-[0_18px_38px_rgba(99,102,241,0.35)] transition active:scale-95",
                active
                  ? "bg-[var(--app-accent)] text-white"
                  : "bg-[var(--app-accent)] text-white"
              )}
              aria-label="Create"
            >
              <Icon size={23} />
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
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Avatar({
  user,
}: {
  user: {
    fullName: string;
    username: string;
    avatarUrl?: string | null;
  };
}) {
  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="size-11 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";

  return pathname === href || pathname.startsWith(`${href}/`);
}