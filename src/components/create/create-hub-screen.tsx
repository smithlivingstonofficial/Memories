"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  LockKeyhole,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QUICK_MEMORY_DRAFT_PREFIX } from "@/lib/quick-memory-draft";

type CreateOption = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  cta: string;
  iconClass: string;
  primary?: boolean;
  vault?: boolean;
};

const createOptions: CreateOption[] = [
  {
    title: "Write a Memory",
    description: "Start with words, then add mood, media, place, and privacy.",
    href: "/create/memory",
    icon: PenLine,
    cta: "Start writing",
    iconClass: "bg-[var(--app-accent)] text-white",
    primary: true,
  },
  {
    title: "Capture a Moment",
    description: "Post a photo or video that stays active for the moment.",
    href: "/create/moment",
    icon: Camera,
    cta: "Open camera",
    iconClass: "bg-emerald-500 text-white",
  },
  {
    title: "Vault Entry",
    description: "Save a private entry that stays visible only to you.",
    href: "/create/vault",
    icon: LockKeyhole,
    cta: "Open Vault",
    iconClass: "bg-[var(--app-heading)] text-[var(--app-bg)]",
    vault: true,
  },
];

export function CreateHubScreen() {
  const [hasQuickDraft, setHasQuickDraft] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHasQuickDraft(
        Object.keys(localStorage)
          .filter((key) => key.startsWith(`${QUICK_MEMORY_DRAFT_PREFIX}.`))
          .some((key) => {
            try {
              const draft = JSON.parse(localStorage.getItem(key) ?? "{}") as {
                title?: string;
                content?: string;
              };

              return Boolean(draft.title?.trim() || draft.content?.trim());
            } catch {
              return false;
            }
          })
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4">
        <div className="mem-card rounded-[1.35rem] p-4 sm:rounded-[2rem] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                <Sparkles size={14} />
                Create
              </p>

              <h1 className="font-brand text-3xl font-semibold leading-tight text-[var(--app-text)] sm:text-4xl">
                Choose what you want to keep.
              </h1>
            </div>

            <Link
              href="/create/memory"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)]"
            >
              Write Memory
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {hasQuickDraft && (
          <Link
            href="/create/memory?draft=quick"
            className="mem-card flex items-center justify-between gap-4 rounded-[1.35rem] p-4 transition hover:border-[var(--app-accent)] sm:rounded-[2rem]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <PenLine size={18} />
              </div>

              <div className="min-w-0">
                <h2 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Continue quick draft
                </h2>
                <p className="truncate text-sm text-[var(--app-muted)]">
                  Pick up where you left the Home composer.
                </p>
              </div>
            </div>

            <ArrowRight size={18} className="shrink-0 text-[var(--app-muted)]" />
          </Link>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {createOptions.map((option) => (
            <CreateOptionCard key={option.title} option={option} />
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <InfoCard
          icon={<CalendarDays size={19} />}
          title="Today's prompt"
          subtitle="A gentle start"
          text="What is one small moment from today that you want to remember later?"
        />

        <InfoCard
          icon={<ShieldCheck size={18} />}
          title="Privacy first"
          subtitle="You choose visibility"
          text="Every memory can be private, public, shared with followers, or saved inside Vault."
        />
      </aside>
    </div>
  );
}

function CreateOptionCard({ option }: { option: CreateOption }) {
  const Icon = option.icon;

  return (
    <Link href={option.href}>
      <div
        className={cn(
          "group flex min-h-[220px] flex-col overflow-hidden rounded-[1.35rem] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_var(--app-shadow)] sm:rounded-[2rem]",
          option.vault
            ? "border border-[var(--app-border)] shadow-[0_24px_80px_var(--app-shadow)] [background:var(--vault-hero)]"
            : "mem-card",
          option.primary && "border-[var(--app-accent)]"
        )}
      >
        <div
          className={cn(
            "mb-6 flex size-13 items-center justify-center rounded-[1.35rem] shadow-[0_18px_40px_var(--app-shadow)]",
            option.iconClass
          )}
        >
          <Icon size={23} />
        </div>

        <div className="flex flex-1 flex-col">
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            {option.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            {option.description}
          </p>

          <div className="mt-auto pt-6">
            <span
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                option.primary
                  ? "bg-[var(--app-accent)] text-white shadow-[0_16px_36px_rgba(99,102,241,0.25)]"
                  : "border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] group-hover:text-[var(--app-text)]"
              )}
            >
              {option.cta}
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function InfoCard({
  icon,
  title,
  subtitle,
  text,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="mem-card rounded-[1.35rem] p-5 sm:rounded-[2rem]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          {icon}
        </div>

        <div>
          <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--app-muted)]">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--app-muted)]">{text}</p>
    </div>
  );
}
