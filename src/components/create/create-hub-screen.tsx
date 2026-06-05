"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { saveCapturedMomentFile } from "@/lib/moments/captured-moment-media";
import { QUICK_MEMORY_DRAFT_PREFIX } from "@/lib/quick-memory-draft";

type CreateOption = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  cta: string;
  iconClass: string;
  primary?: boolean;
  camera?: boolean;
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
    camera: true,
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
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-2xl sm:rounded-[1.8rem] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.24),transparent_34%)]" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                <Sparkles size={14} />
                Create
              </p>

              <h1 className="font-brand text-2xl font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
                Choose what to keep
              </h1>
            </div>

            <Link
              href="/create/memory"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:bg-[var(--app-accent-hover)] sm:h-11 sm:px-5"
            >
              Write Memory
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {hasQuickDraft && (
          <Link
            href="/create/memory?draft=quick"
            className="mem-card flex items-center justify-between gap-4 rounded-[1.5rem] p-3.5 transition hover:border-[var(--app-accent)] sm:rounded-[1.8rem] sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
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

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          {createOptions.map((option) => (
            <CreateOptionCard key={option.title} option={option} />
          ))}
        </div>
      </section>

      <aside className="space-y-4 sm:space-y-5">
        <InfoCard
          icon={<CalendarDays size={19} />}
          title="Today's prompt"
          text="What is one small moment from today that you want to remember later?"
        />

        <InfoCard
          icon={<ShieldCheck size={18} />}
          title="Privacy first"
          text="Every memory can be private, public, shared with followers, or saved inside Vault."
        />
      </aside>
    </div>
  );
}

function CreateOptionCard({ option }: { option: CreateOption }) {
  const Icon = option.icon;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  async function handleCapture(file: File | null) {
    if (!file) return;

    setIsPreparing(true);

    try {
      await saveCapturedMomentFile(file);
      router.push("/create/moment?capture=1");
    } catch {
      router.push(option.href);
    }
  }

  const cardClassName = cn(
    "group relative flex min-h-[82px] items-center gap-3 overflow-hidden rounded-[1.3rem] border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_70px_var(--app-shadow)] sm:min-h-[190px] sm:flex-col sm:items-start sm:gap-0 sm:rounded-[1.8rem] sm:p-5",
    option.vault
      ? "border-[var(--app-border)] shadow-[0_18px_60px_var(--app-shadow)] [background:var(--vault-hero)]"
      : "border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_18px_60px_var(--app-shadow)]",
    option.primary && "border-[var(--app-accent)]"
  );

  const cardContent = (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(circle_at_88%_0%,rgba(99,102,241,0.18),transparent_34%)]" />

      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-[1.2rem] shadow-[0_14px_34px_var(--app-shadow)] sm:mb-4 sm:size-12 sm:rounded-[1.25rem]",
          option.iconClass
        )}
      >
        <Icon size={20} />
      </div>

      <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3 sm:flex-col sm:items-start sm:justify-start">
        <div className="min-w-0">
          <h2 className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-xl">
            {option.title}
          </h2>

          <p className="mt-2 hidden text-sm leading-6 text-[var(--app-muted)] sm:line-clamp-2 sm:block">
            {option.description}
          </p>
        </div>

        <div className="shrink-0 sm:mt-auto sm:pt-5">
          <span
            className={cn(
              "inline-flex size-10 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition sm:w-auto sm:px-4",
              option.primary
                ? "bg-[var(--app-accent)] text-white shadow-[0_14px_32px_rgba(99,102,241,0.22)]"
                : "border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] group-hover:text-[var(--app-text)]"
            )}
          >
            <span className="hidden sm:inline">
              {isPreparing ? "Opening..." : option.cta}
            </span>
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </>
  );

  if (option.camera) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void handleCapture(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPreparing}
          className={cn(cardClassName, "disabled:cursor-wait disabled:opacity-70")}
        >
          {cardContent}
        </button>
      </>
    );
  }

  return (
    <Link href={option.href} className={cardClassName}>
      {cardContent}
    </Link>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          {icon}
        </div>

        <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          {title}
        </h3>
      </div>

      <p className="text-sm leading-6 text-[var(--app-muted)]">{text}</p>
    </div>
  );
}
