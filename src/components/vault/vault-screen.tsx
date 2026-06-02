import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Eye,
  ImagePlus,
  LockKeyhole,
  Moon,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { lockVaultAction } from "@/app/actions/vault";
import type { FeedMemory } from "@/types/memory";

type VaultScreenProps = {
  entries: FeedMemory[];
};

export function VaultScreen({ entries }: VaultScreenProps) {
  const totalWords = entries.reduce((total, entry) => {
    const words =
      entry.content.trim().length === 0
        ? 0
        : entry.content.trim().split(/\s+/).length;

    return total + words;
  }, 0);

  const mediaCount = entries.reduce(
    (total, entry) => total + entry.media.length,
    0
  );

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="relative mb-5 overflow-hidden rounded-[2rem] border border-[var(--app-border)] p-5 shadow-[0_24px_80px_var(--app-shadow)] [background:var(--vault-hero)] sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#6366F1]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 size-72 rounded-full bg-[#FFE4E6]/30 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <LockKeyhole size={14} />
              Private Vault
            </p>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Your private Vault
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Thoughts, prayers, memories, and feelings only you can see. Vault
              entries never appear in Home, Discover, or public profiles.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={lockVaultAction}>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Lock Vault
                <LockKeyhole size={17} />
              </button>
            </form>

            <Link
              href="/create/vault"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)]"
            >
              Write in Vault
              <PenLine size={17} />
            </Link>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <VaultStat label="Entries" value={entries.length.toString()} />
          <VaultStat label="Words" value={totalWords.toString()} />
          <VaultStat label="Media" value={mediaCount.toString()} />
        </div>
      </section>

      {entries.length === 0 ? (
        <EmptyVault />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid min-w-0 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {entries.map((entry) => (
              <VaultEntryCard key={entry.id} entry={entry} />
            ))}
          </section>

          <aside className="hidden space-y-5 xl:block">
            <InfoCard
              icon={<ShieldCheck size={17} />}
              title="Private by design"
              subtitle="Only you can see this."
              text="Vault memories are saved with private visibility and are never shown in Home, Discover, or public profile grids."
            />

            <InfoCard
              icon={<Moon size={17} />}
              title="Gentle prompt"
              subtitle="For today"
              text="What is something you felt today but did not say out loud?"
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function VaultEntryCard({ entry }: { entry: FeedMemory }) {
  const firstMedia = entry.media[0];

  return (
    <article className="mem-card overflow-hidden rounded-[2rem] p-4">
      {firstMedia ? (
        <div className="mb-4 overflow-hidden rounded-[1.5rem] bg-[var(--vault-private)]">
          {firstMedia.mediaKind === "image" ? (
            <img
              src={firstMedia.url}
              alt={entry.title ?? "Vault media"}
              className="h-56 w-full object-cover"
            />
          ) : firstMedia.mediaKind === "video" ? (
            <video
              src={firstMedia.url}
              className="h-56 w-full object-cover"
              controls
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-[var(--app-muted)]">
              <ImagePlus />
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 flex h-56 items-center justify-center rounded-[1.5rem] [background:var(--vault-hero)]">
          <LockKeyhole className="text-[var(--app-accent)]" />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {entry.moods.map((mood) => (
          <span
            key={mood}
            className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
          >
            {mood}
          </span>
        ))}

        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <LockKeyhole size={12} />
          Vault
        </span>
      </div>

      <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
        {formatDate(entry.createdAt)}
      </p>

      <h2 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {entry.title || "Untitled Vault entry"}
      </h2>

      <p className="mt-2 line-clamp-5 text-sm leading-6 text-[var(--app-muted)]">
        {entry.content}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4">
        <p className="inline-flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
          <Eye size={14} />
          Only you
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={`/vault/${entry.id}/edit`}
            className="flex size-9 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-accent)]"
            aria-label="Edit Vault entry"
          >
            <PenLine size={16} />
          </Link>

          <DeleteMemoryButton memoryId={entry.id} type="vault" />

          <Link
            href={`/vault/${entry.id}/edit`}
            className="text-xs font-semibold text-[var(--app-accent)]"
          >
            Edit
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyVault() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <LockKeyhole size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        Your Vault is empty
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Start with a private thought, feeling, prayer, or memory that only you
        should see.
      </p>

      <Link
        href="/create/vault"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
      >
        Write first Vault entry
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

function VaultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
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
    <div className="mem-card rounded-[2rem] p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          {icon}
        </div>

        <div>
          <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[var(--app-text)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--app-muted)]">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--app-muted)]">{text}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
