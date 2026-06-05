"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileMenuScreen } from "@/components/layout/mobile-menu-screen";
import type { AppUser } from "@/components/layout/layout-types";
import {
  getQuickMemoryDraftKey,
  QUICK_MEMORY_CLEAR_FLAG,
} from "@/lib/quick-memory-draft";

type AppLayoutProps = {
  children: ReactNode;
  user: AppUser;
};

const AppLayoutContext = createContext(false);

const SIDEBAR_STORAGE_KEY = "memories-sidebar-collapsed";

function getInitialSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const insidePersistentShell = useContext(AppLayoutContext);

  if (insidePersistentShell) {
    return <>{children}</>;
  }

  return <PersistentAppLayout user={user}>{children}</PersistentAppLayout>;
}

function PersistentAppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideMobileBottomNav = pathname.startsWith("/messages");
  const isMapPage = pathname === "/map";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!user.id || !pathname.startsWith("/diary/day/")) return;

    const clearUserId = sessionStorage.getItem(QUICK_MEMORY_CLEAR_FLAG);

    if (clearUserId !== user.id) return;

    localStorage.removeItem(getQuickMemoryDraftKey(user.id));
    sessionStorage.removeItem(QUICK_MEMORY_CLEAR_FLAG);
  }, [pathname, user.id]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const nextValue = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="mem-bg relative h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 mem-page-gradient" />

        <div className="relative flex h-full">
          <DesktopSidebar
            user={user}
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />

          <main className="flex h-full min-w-0 flex-1 flex-col">
            <AppTopBar user={user} />

            <section
              className={
                isMapPage
                  ? "min-h-0 w-full max-w-full flex-1 overflow-hidden p-0"
                  : hideMobileBottomNav
                  ? "min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-3 [scrollbar-gutter:stable] sm:px-6 sm:pt-4 lg:px-8 lg:pb-8"
                  : "min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 pb-[104px] pt-3 [scrollbar-gutter:stable] sm:px-6 sm:pb-[112px] sm:pt-4 lg:px-8 lg:pb-8"
              }
            >
              {children}
            </section>
          </main>

          {!mobileMenuOpen && !hideMobileBottomNav && (
            <MobileBottomNav
              pathname={pathname}
              menuOpen={mobileMenuOpen}
              onOpenMenu={() => setMobileMenuOpen(true)}
              elevated={isMapPage}
            />
          )}

          {mobileMenuOpen && (
            <MobileMenuScreen
              pathname={pathname}
              user={user}
              onClose={() => setMobileMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
}
