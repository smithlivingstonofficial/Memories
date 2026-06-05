import Link from "next/link";
import {
  ArrowRight,
  Eye,
  ImagePlus,
  LockKeyhole,
  PenLine,
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
      <section className="relative mb-4 overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] p-3.5 shadow-[0_18px_60px_var(--app-shadow)] [background:var(--vault-hero)] sm:mb-5 sm:rounded-[1.8rem] sm:p-5">
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#6366F1]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 size-72 rounded-full bg-[#FFE4E6]/30 blur-3xl" />

        <div className="relative grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <LockKeyhole size={14} />
              Private Vault
            </p>

            <h1 className="font-brand text-2xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Your private Vault
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form action={lockVaultAction}>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] sm:h-12 sm:px-5"
              >
                Lock Vault
                <LockKeyhole size={17} />
              </button>
            </form>

            <Link
              href="/create/vault"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:bg-[var(--app-accent-hover)] sm:h-12 sm:px-5"
            >
              <span className="hidden sm:inline">Write in Vault</span>
              <span className="sm:hidden">Write</span>
              <PenLine size={17} />
            </Link>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2.5 sm:mt-4 sm:gap-3">
          <VaultStat label="Entries" value={entries.length.toString()} />
          <VaultStat label="Words" value={totalWords.toString()} />
          <VaultStat label="Media" value={mediaCount.toString()} />
        </div>
      </section>

      {entries.length === 0 ? (
        <EmptyVault />
      ) : (
        <section className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {entries.map((entry) => (
            <VaultEntryCard key={entry.id} entry={entry} />
          ))}
        </section>
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
        {formatMemoryDate(entry)}
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
    <div className="rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2.5 backdrop-blur-xl sm:rounded-[1.35rem] sm:p-3.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)] sm:text-[10px] sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 font-brand text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function formatMemoryDate(memory: FeedMemory) {
  return formatDate(memory.entryDate ?? memory.createdAt);
}

function formatDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
