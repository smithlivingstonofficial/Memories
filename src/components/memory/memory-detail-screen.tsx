import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PenLine,
  Tag,
} from "lucide-react";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { DeleteReflectionButton } from "@/components/memory/delete-reflection-button";
import { MemoryEngagementBar } from "@/components/memory/memory-engagement-bar";
import type {
  MemoryDetailData,
  MemoryReflection,
} from "@/lib/memories/get-memory-detail-data";
import type { FeedMemory } from "@/types/memory";

type MemoryDetailScreenProps = {
  data: MemoryDetailData;
};

export function MemoryDetailScreen({ data }: MemoryDetailScreenProps) {
  const { memory, reflections, viewer } = data;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {viewer.isOwner && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/memory/${memory.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
              >
                <PenLine size={15} />
                Edit
              </Link>

              <DeleteMemoryButton
                memoryId={memory.id}
                type="memory"
                variant="text"
              />
            </div>
          )}
        </div>

        <MemoryHeader memory={memory} />

        <MediaSection memory={memory} />

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap gap-2">
            {memory.moods.map((mood) => (
              <span
                key={mood}
                className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
              >
                {mood}
              </span>
            ))}

            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
              <LockKeyhole size={12} />
              {formatPrivacy(memory.privacy)}
            </span>
          </div>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
            {memory.title || "Untitled memory"}
          </h1>

          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[var(--app-muted)] sm:text-base">
            {memory.content}
          </p>

          {memory.locationName && (
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--app-muted)]">
              <MapPin size={16} />
              {memory.locationName}
            </p>
          )}

          {memory.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]"
                >
                  <Tag size={12} />
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-4 text-xs font-medium text-[var(--app-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface-soft)] px-3 py-1">
              <CalendarDays size={12} />
              Created {formatDateTime(memory.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface-soft)] px-3 py-1">
              <CalendarDays size={12} />
              Last edited {formatDateTime(memory.updatedAt)}
            </span>
          </div>

          <MemoryEngagementBar
            memoryId={memory.id}
            initialLikeCount={memory.engagement.likeCount}
            initialReflectionCount={memory.engagement.reflectionCount}
            initiallyLiked={memory.engagement.viewerHasLiked}
            canEngage={memory.engagement.canEngage}
          />
        </div>
      </section>

      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <MessageCircle size={14} />
              Reflections
            </p>

            <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
              What people reflected
            </h2>
          </div>

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
            {reflections.length}
          </span>
        </div>

        {reflections.length === 0 ? (
          <EmptyReflections />
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MemoryHeader({ memory }: { memory: FeedMemory }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-5">
      <Link href={`/u/${memory.author.username}`} className="shrink-0">
        <Avatar
          fullName={memory.author.fullName}
          avatarUrl={memory.author.avatarUrl}
          size="md"
        />
      </Link>

      <div className="min-w-0">
        <Link
          href={`/u/${memory.author.username}`}
          className="truncate text-sm font-semibold text-[var(--app-text)] transition hover:text-[var(--app-accent)]"
        >
          {memory.author.fullName}
        </Link>

        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--app-muted)]">
          <span>@{memory.author.username}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} />
            {formatMemoryDate(memory)}
          </span>
        </p>
      </div>
    </div>
  );
}

function MediaSection({ memory }: { memory: FeedMemory }) {
  if (memory.media.length === 0) {
    return (
      <div className="mt-5 flex h-[360px] items-center justify-center rounded-[1.7rem] [background:var(--vault-hero)]">
        <ImagePlus className="text-[var(--app-accent)]" />
      </div>
    );
  }

  if (memory.media.length === 1) {
    const media = memory.media[0];

    return (
      <div className="mt-5 overflow-hidden rounded-[1.7rem] bg-[var(--app-surface-soft)]">
        {media.mediaKind === "image" ? (
          <img
            src={media.url}
            alt={memory.title ?? "Memory media"}
            className="max-h-[680px] w-full object-cover"
          />
        ) : media.mediaKind === "video" ? (
          <video
            src={media.url}
            className="max-h-[680px] w-full object-cover"
            controls
          />
        ) : (
          <div className="flex h-[360px] items-center justify-center text-[var(--app-accent)]">
            <ImagePlus />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {memory.media.map((media) => (
        <div
          key={media.id}
          className="overflow-hidden rounded-[1.5rem] bg-[var(--app-surface-soft)]"
        >
          {media.mediaKind === "image" ? (
            <img
              src={media.url}
              alt={memory.title ?? "Memory media"}
              className="h-72 w-full object-cover"
            />
          ) : media.mediaKind === "video" ? (
            <video
              src={media.url}
              className="h-72 w-full object-cover"
              controls
            />
          ) : (
            <div className="flex h-72 items-center justify-center text-[var(--app-accent)]">
              <ImagePlus />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReflectionCard({ reflection }: { reflection: MemoryReflection }) {
  return (
    <article className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
      <div className="flex gap-3">
        <Link href={`/u/${reflection.author.username}`} className="shrink-0">
          <Avatar
            fullName={reflection.author.fullName}
            avatarUrl={reflection.author.avatarUrl}
            size="sm"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/u/${reflection.author.username}`}
                  className="text-sm font-semibold text-[var(--app-text)] transition hover:text-[var(--app-accent)]"
                >
                  {reflection.author.fullName}
                </Link>

                <span className="text-xs text-[var(--app-muted)]">
                  @{reflection.author.username}
                </span>

                <span className="text-xs text-[var(--app-faint)]">
                  {formatDate(reflection.createdAt)}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--app-muted)]">
                {reflection.content}
              </p>
            </div>

            {reflection.canDelete && (
              <div className="shrink-0">
                <DeleteReflectionButton reflectionId={reflection.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyReflections() {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[1.3rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <MessageCircle size={22} />
      </div>

      <h3 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No reflections yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Be the first to write a thoughtful reflection on this memory.
      </p>
    </div>
  );
}

function Avatar({
  fullName,
  avatarUrl,
  size,
}: {
  fullName: string;
  avatarUrl: string | null;
  size: "sm" | "md";
}) {
  const className =
    size === "md" ? "size-12 rounded-2xl" : "size-10 rounded-[1rem]";

  const initials =
    fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-[var(--app-soft)] font-brand text-sm font-semibold text-[var(--app-accent)]`}
    >
      {initials}
    </div>
  );
}

function formatPrivacy(value: FeedMemory["privacy"]) {
  const labels = {
    private: "Private",
    inner_circle: "Inner Circle",
    followers: "Followers",
    public: "Public",
    vault: "Vault",
  };

  return labels[value];
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

function formatDateTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
