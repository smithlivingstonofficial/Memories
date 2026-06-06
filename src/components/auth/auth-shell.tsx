"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { legalNavLinks } from "@/components/legal/legal-content";

type AuthShellProps = {
  children: ReactNode;
  variant?: "brand" | "centered";
};

const featureCards = [
  {
    icon: Heart,
    title: "Memory timeline",
    text: "Keep moments organized across days, places, and people.",
  },
  {
    icon: LockKeyhole,
    title: "Private Vault",
    text: "Protect the notes and keepsakes meant only for you.",
  },
  {
    icon: Users,
    title: "Inner Circle",
    text: "Share selectively with the people who matter.",
  },
  {
    icon: CalendarDays,
    title: "Diary rhythm",
    text: "Return to reflections without losing your place.",
  },
];

export function AuthShell({ children, variant = "brand" }: AuthShellProps) {
  if (variant === "centered") {
    return (
      <main className="mem-bg relative min-h-dvh overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 mem-page-gradient" />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
          {children}
          <AuthLegalLinks />
        </div>
      </main>
    );
  }

  return (
    <main className="mem-bg relative min-h-dvh overflow-x-hidden lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mem-page-gradient" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1500px] gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-6 lg:px-8 lg:py-3 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="order-2 hidden min-w-0 lg:order-1 lg:block">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mem-card relative overflow-hidden rounded-[1.6rem] p-4 xl:rounded-[1.8rem] xl:p-5"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.22),transparent_32%)]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <BrandLogo priority />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-accent)]">
                    Memories
                  </p>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Private-first life archive
                  </p>
                </div>
              </div>

              <h1 className="font-brand mt-6 max-w-3xl text-[clamp(2.7rem,4.4vw,4.35rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--app-heading)] xl:text-[clamp(3rem,4.8vw,4.8rem)]">
                Your memories,
                <br />
                kept close.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--app-muted)]">
                Save meaningful moments, protect private writing, and share only
                with the people you choose.
              </p>

              <div className="mt-6 grid max-w-3xl grid-cols-2 gap-3">
                {featureCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3.5"
                    >
                      <div className="mb-2.5 flex size-9 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                        <Icon size={18} />
                      </div>

                      <h3 className="truncate text-sm font-semibold text-[var(--app-text)]">
                        {item.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--app-muted)]">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <ShieldCheck size={18} />
                </div>
                <p className="text-sm leading-6 text-[var(--app-muted)]">
                  Google verification starts the account, then your Memories
                  password keeps email login simple.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="order-1 flex min-w-0 flex-col items-center justify-center lg:order-2">
          <div className="mb-4 flex w-full max-w-[460px] items-center gap-3 lg:hidden">
            <BrandLogo priority />
            <div className="min-w-0">
              <p className="font-brand text-2xl font-semibold tracking-[-0.055em] text-[var(--app-heading)]">
                Memories
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                Private-first life archive
              </p>
            </div>
          </div>

          {children}

          <div className="mt-3 grid w-full max-w-[460px] grid-cols-3 gap-2 lg:hidden">
            {featureCards.slice(0, 3).map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="mem-card flex min-h-[76px] flex-col justify-between rounded-[1.25rem] p-3"
                >
                  <Icon size={17} className="text-[var(--app-accent)]" />
                  <p className="truncate text-[11px] font-semibold text-[var(--app-text)]">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>

          <AuthLegalLinks />
        </section>
      </div>
    </main>
  );
}

function AuthLegalLinks() {
  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 text-[11px] font-semibold text-[var(--app-muted)]"
      aria-label="Legal links"
    >
      {legalNavLinks
        .filter((link) =>
          ["privacy", "terms", "disclaimer", "contact"].includes(link.id)
        )
        .map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-[var(--app-accent)]"
          >
            {link.label}
          </Link>
        ))}
    </nav>
  );
}
