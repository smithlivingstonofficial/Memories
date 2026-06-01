import Link from "next/link";
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

type CreateOption = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: "available" | "coming";
  cta: string;
  iconClass: string;
  vault?: boolean;
};

const createOptions: CreateOption[] = [
  {
    title: "Write a Memory",
    description:
      "Save a meaningful moment with words, mood, media, privacy, and emotion.",
    href: "/create/memory",
    icon: PenLine,
    status: "available",
    cta: "Start writing",
    iconClass: "bg-[var(--app-accent)] text-white",
  },
  {
    title: "Quick Moment",
    description:
      "Capture a photo or video instantly using your camera. Built for fast memories.",
    href: "/create/moment",
    icon: Camera,
    status: "available",
    cta: "Start capturing",
    iconClass: "bg-emerald-500 text-white",
  },
  {
    title: "Vault Entry",
    description:
      "Write something private, quiet, and visible only to you inside your Vault.",
    href: "/create/vault",
    icon: LockKeyhole,
    status: "available",
    cta: "Start writing",
    iconClass: "bg-[var(--app-heading)] text-[var(--app-bg)]",
    vault: true,
  },
];

export function CreateHubScreen() {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-5">
        <div className="mem-card rounded-[2rem] p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Sparkles size={14} />
              Create
            </p>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              What do you want to keep today?
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Choose one simple way to save your day. Memories is designed to
              feel calm, private, and meaningful.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {createOptions.map((option) => {
            const Icon = option.icon;
            const available = option.status === "available";

            const cardContent = (
              <div
                className={cn(
                  "group relative flex min-h-[260px] flex-col overflow-hidden rounded-[2rem] p-5 transition-all duration-300",
                  option.vault
                    ? "border border-[var(--app-border)] shadow-[0_24px_80px_var(--app-shadow)] [background:var(--vault-hero)]"
                    : "mem-card",
                  available
                    ? "hover:-translate-y-1 hover:shadow-[0_30px_90px_var(--app-shadow)]"
                    : "opacity-80"
                )}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[var(--app-accent)]/10 blur-2xl" />

                <div
                  className={cn(
                    "relative mb-6 flex size-13 items-center justify-center rounded-[1.35rem] shadow-[0_18px_40px_var(--app-shadow)]",
                    option.iconClass
                  )}
                >
                  <Icon size={23} />
                </div>

                <div className="relative flex flex-1 flex-col">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                      {option.title}
                    </h2>

                    {!available && (
                      <span className="shrink-0 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1 text-[11px] font-semibold text-[var(--app-muted)]">
                        Next
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-6 text-[var(--app-muted)]">
                    {option.description}
                  </p>

                  <div className="mt-auto pt-6">
                    <div
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                        available
                          ? "bg-[var(--app-accent)] text-white shadow-[0_16px_36px_rgba(99,102,241,0.25)]"
                          : "border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)]"
                      )}
                    >
                      {option.cta}
                      {available && <ArrowRight size={16} />}
                    </div>
                  </div>
                </div>
              </div>
            );

            if (!available) {
              return <div key={option.title}>{cardContent}</div>;
            }

            return (
              <Link key={option.title} href={option.href}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5">
        <InfoCard
          icon={<CalendarDays size={19} />}
          title="Today’s prompt"
          subtitle="A gentle start"
          text="What is one small moment from today that you want to remember later?"
        />

        <InfoCard
          icon={<ShieldCheck size={18} />}
          title="Privacy first"
          subtitle="You choose visibility"
          text="Every memory can be private, shared with Inner Circle, public, or saved privately inside Vault."
        />
      </aside>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  subtitle,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="mem-card rounded-[2rem] p-5">
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
