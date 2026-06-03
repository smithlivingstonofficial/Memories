"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const INSTALLED_KEY = "memories-pwa-installed";
const SNOOZE_UNTIL_KEY = "memories-pwa-install-snooze-until";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 8000;

const allowedRoutes = [
  "/home",
  "/dashboard",
  "/calendar",
  "/timeline",
  "/vault",
  "/profile",
  "/discover",
  "/on-this-day",
  "/keepsakes",
  "/inner-circle",
  "/requests",
  "/settings",
];

const blockedRoutes = [
  "/create",
  "/messages",
  "/login",
  "/signup",
  "/complete-profile",
  "/memory",
  "/moment",
  "/settings/security",
];

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const canShowOnRoute = useMemo(() => {
    if (blockedRoutes.some((route) => pathname.startsWith(route))) {
      return false;
    }

    return allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  }, [pathname]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function registerServiceWorker() {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Install support should never interrupt the app if registration fails.
      });
    }

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  useEffect(() => {
    function isInstalled() {
      return (
        localStorage.getItem(INSTALLED_KEY) === "true" ||
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true)
      );
    }

    function isSnoozed() {
      const snoozeUntil = Number(localStorage.getItem(SNOOZE_UNTIL_KEY) ?? 0);
      return Number.isFinite(snoozeUntil) && snoozeUntil > Date.now();
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();

      if (isInstalled() || isSnoozed()) return;

      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      localStorage.setItem(INSTALLED_KEY, "true");
      localStorage.removeItem(SNOOZE_UNTIL_KEY);
      setVisible(false);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isInstalled()) {
      localStorage.setItem(INSTALLED_KEY, "true");
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!installEvent || !canShowOnRoute) {
      const hideTimeoutId = window.setTimeout(() => {
        setVisible(false);
      }, 0);

      return () => {
        window.clearTimeout(hideTimeoutId);
      };
    }

    const showTimeoutId = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(showTimeoutId);
    };
  }, [canShowOnRoute, installEvent]);

  function dismiss() {
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + SNOOZE_MS));
    setVisible(false);
  }

  async function install() {
    if (!installEvent) return;

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
        localStorage.removeItem(SNOOZE_UNTIL_KEY);
      } else {
        localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + SNOOZE_MS));
      }
    } finally {
      setInstalling(false);
      setVisible(false);
      setInstallEvent(null);
    }
  }

  if (!visible || !installEvent) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 lg:bottom-6 lg:justify-end lg:px-6">
      <section className="pointer-events-auto w-full max-w-sm rounded-[1.45rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <Download size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-brand text-sm font-semibold text-[var(--app-text)]">
                  Install Memories
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                  Open it like an app from your device.
                </p>
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
                aria-label="Dismiss install prompt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={install}
                disabled={installing}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(99,102,241,0.28)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
              >
                <Download size={16} />
                {installing ? "Opening..." : "Install"}
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="h-10 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
