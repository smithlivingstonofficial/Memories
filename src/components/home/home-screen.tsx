"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ImagePlus,
  MoreHorizontal,
  PenLine,
  Plus,
  LockKeyhole,
} from "lucide-react";
import { HomeMomentsRealtimeRefresh } from "@/components/home/home-moments-realtime-refresh";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { MemoryEngagementBar } from "@/components/memory/memory-engagement-bar";
import {
  getQuickMemoryDraftKey,
  type QuickMemoryDraft,
} from "@/lib/quick-memory-draft";
import type { FeedMemory } from "@/types/memory";
import type { ActiveMoment } from "@/types/moment";

type HomeScreenProps = {
  memories: FeedMemory[];
  activeMoments: ActiveMoment[];
  currentUserId: string;
};

type MomentGroup = {
  ownerId: string;
  author: ActiveMoment["author"];
  moments: ActiveMoment[];
  latestMoment: ActiveMoment;
  entryMoment: ActiveMoment;
  isCurrentUser: boolean;
};

export function HomeScreen({
  memories,
  activeMoments,
  currentUserId,
}: HomeScreenProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <HomeMomentsRealtimeRefresh />

      <div className="min-w-0 space-y-4">
        <MomentsTray
          activeMoments={activeMoments}
          currentUserId={currentUserId}
        />

        <QuickMemoryCapture currentUserId={currentUserId} />

        {memories.length === 0 ? (
          <EmptyFeed />
        ) : (
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                canDelete={memory.author.id === currentUserId}
              />
            ))}
          </section>
        )}
      </div>

      <aside className="hidden space-y-4 xl:block">
        <DesktopSideArea />
      </aside>
    </div>
  );
}

function QuickMemoryCapture({ currentUserId }: { currentUserId: string }) {
  const draftKey = getQuickMemoryDraftKey(currentUserId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const draft = readDraft(draftKey);

      setTitle(draft.title);
      setContent(draft.content);
      setStatus(draft.updatedAt ? "Draft" : "");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftKey]);

  const wordCount =
    content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  function saveDraft(nextTitle: string, nextContent: string) {
    if (!nextTitle.trim() && !nextContent.trim()) {
      localStorage.removeItem(draftKey);
      setStatus("");
      return;
    }

    const draft: QuickMemoryDraft = {
      title: nextTitle,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
    setStatus("Saved");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    saveDraft(value, content);
  }

  function handleContentChange(value: string) {
    setContent(value);
    saveDraft(title, value);
  }

  return (
    <section className="mem-card rounded-[1.6rem] p-4 shadow-[0_18px_60px_var(--app-shadow)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <PenLine size={18} />
          </div>

          <div className="min-w-0">
            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Quick memory
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
              <span>{dateLabel}</span>
              <span>{wordCount} words</span>
              {status && <span>{status}</span>}
            </div>
          </div>
        </div>

        <Link
          href="/create/memory?draft=quick"
          className="flex h-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)]"
        >
          Continue
        </Link>
      </div>

      <input
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
        placeholder="Title"
        className="mb-2 h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 font-brand text-lg font-semibold tracking-[-0.035em] text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
      />

      <textarea
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        placeholder="Write a quick draft..."
        rows={3}
        className="min-h-[92px] w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-[15px] leading-6 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
      />
    </section>
  );
}

function readDraft(key: string): QuickMemoryDraft {
  if (typeof window === "undefined") {
    return { title: "", content: "", updatedAt: "" };
  }

  try {
    const rawDraft = localStorage.getItem(key);
    if (!rawDraft) return { title: "", content: "", updatedAt: "" };

    const draft = JSON.parse(rawDraft) as Partial<QuickMemoryDraft>;

    return {
      title: typeof draft.title === "string" ? draft.title : "",
      content: typeof draft.content === "string" ? draft.content : "",
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : "",
    };
  } catch {
    return { title: "", content: "", updatedAt: "" };
  }
}

function DesktopSideArea() {
  return (
    <>
      <Link
        href="/calendar"
        className="mem-card flex items-center justify-between rounded-[1.6rem] p-4 transition hover:border-[var(--app-accent)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <CalendarDays size={18} />
          </div>
          <span className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Calendar
          </span>
        </div>
        <Plus size={18} className="text-[var(--app-muted)]" />
      </Link>

      <Link
        href="/create/vault"
        className="mem-card flex items-center justify-between rounded-[1.6rem] p-4 transition hover:border-[var(--app-accent)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
            <LockKeyhole size={18} />
          </div>
          <span className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Vault
          </span>
        </div>
        <Plus size={18} className="text-[var(--app-muted)]" />
      </Link>
    </>
  );
}

function MomentsTray({
  activeMoments,
  currentUserId,
}: {
  activeMoments: ActiveMoment[];
  currentUserId: string;
}) {
  const groupedMoments = groupMomentsByUser(activeMoments, currentUserId);
  const myGroup = groupedMoments.find((group) => group.isCurrentUser);
  const otherGroups = groupedMoments.filter((group) => !group.isCurrentUser);

  return (
    <section className="mem-card overflow-hidden rounded-[1.6rem]">
      <div className="p-4">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          <YourMomentCard group={myGroup} />

          {otherGroups.map((group) => (
            <MomentGroupItem key={group.ownerId} group={group} />
          ))}

          {groupedMoments.length === 0 && (
            <div className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <CalendarDays size={17} />
              </div>
              <p className="text-sm font-semibold text-[var(--app-text)]">
                No active Moments
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function YourMomentCard({ group }: { group?: MomentGroup }) {
  const firstMedia = group?.latestMoment.media[0];

  if (group) {
    return (
      <div className="shrink-0 text-center">
        <div className="relative">
          <Link href={`/moment/${group.entryMoment.id}`} className="group block">
            <MomentThumb
              firstMedia={firstMedia}
              label={
                group.moments.length > 1
                  ? `${group.moments.length} Moments`
                  : group.latestMoment.mood ?? "Moment"
              }
              alt={group.latestMoment.caption ?? "Your Moment"}
            />
          </Link>

          <Link
            href="/create/moment"
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-xl border-2 border-[var(--app-surface-strong)] bg-[var(--app-accent)] text-white shadow-lg"
            aria-label="Add another Moment"
          >
            <Plus size={14} />
          </Link>
        </div>

        <p className="mt-1 max-w-[74px] truncate text-xs font-semibold text-[var(--app-text)]">
          Your Moment
        </p>
      </div>
    );
  }

  return (
    <Link href="/create/moment" className="shrink-0 text-center">
      <div className="rounded-[1.35rem] bg-[var(--app-border)] p-[2px]">
        <div className="flex size-[74px] items-center justify-center rounded-[1.25rem] bg-[var(--app-surface-strong)] text-[var(--app-accent)]">
          <Plus size={20} />
        </div>
      </div>

      <p className="mt-1 max-w-[74px] truncate text-xs font-semibold text-[var(--app-muted)]">
        Your Moment
      </p>
    </Link>
  );
}

function MomentGroupItem({ group }: { group: MomentGroup }) {
  const firstMedia = group.latestMoment.media[0];

  return (
    <Link
      href={`/moment/${group.entryMoment.id}`}
      className="group shrink-0 text-center"
    >
      <MomentThumb
        firstMedia={firstMedia}
        label={
          group.moments.length > 1
            ? `${group.moments.length} Moments`
            : group.latestMoment.mood ?? "Moment"
        }
        alt={group.latestMoment.caption ?? "Moment"}
        avatarUrl={group.author.avatarUrl}
        avatarAlt={group.author.fullName}
      />

      <p className="mt-1 max-w-[74px] truncate text-xs font-medium text-[var(--app-muted)]">
        {group.author.fullName}
      </p>
    </Link>
  );
}

function MomentThumb({
  firstMedia,
  label,
  alt,
  avatarUrl,
  avatarAlt,
}: {
  firstMedia?: ActiveMoment["media"][number];
  label: string;
  alt: string;
  avatarUrl?: string | null;
  avatarAlt?: string;
}) {
  return (
    <div className="rounded-[1.35rem] bg-gradient-to-br from-[#6366F1] via-[#A5B4FC] to-[#FFE4E6] p-[2px]">
      <div className="relative size-[74px] overflow-hidden rounded-[1.25rem] bg-[var(--app-surface-strong)]">
        {firstMedia?.mediaKind === "image" ? (
          <img
            src={firstMedia.url}
            alt={alt}
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : firstMedia?.mediaKind === "video" ? (
          <video
            src={firstMedia.url}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--app-accent)]">
            <ImagePlus size={18} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-1">
          <p className="truncate text-[9px] font-semibold text-white">
            {label}
          </p>
        </div>

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={avatarAlt ?? "Avatar"}
            className="absolute left-1 top-1 size-5 rounded-lg border border-white/70 object-cover"
          />
        )}
      </div>
    </div>
  );
}

function groupMomentsByUser(
  activeMoments: ActiveMoment[],
  currentUserId: string
): MomentGroup[] {
  const map = new Map<string, MomentGroup>();

  for (const moment of activeMoments) {
    const existing = map.get(moment.ownerId);

    if (!existing) {
      map.set(moment.ownerId, {
        ownerId: moment.ownerId,
        author: moment.author,
        moments: [moment],
        latestMoment: moment,
        entryMoment: moment,
        isCurrentUser: moment.ownerId === currentUserId,
      });

      continue;
    }

    existing.moments.push(moment);

    if (
      new Date(moment.createdAt).getTime() >
      new Date(existing.latestMoment.createdAt).getTime()
    ) {
      existing.latestMoment = moment;
    }

    if (
      new Date(moment.createdAt).getTime() <
      new Date(existing.entryMoment.createdAt).getTime()
    ) {
      existing.entryMoment = moment;
    }
  }

  for (const group of map.values()) {
    group.moments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.isCurrentUser && !b.isCurrentUser) return -1;
    if (!a.isCurrentUser && b.isCurrentUser) return 1;

    return (
      new Date(b.latestMoment.createdAt).getTime() -
      new Date(a.latestMoment.createdAt).getTime()
    );
  });
}

function MemoryCard({
  memory,
  canDelete,
}: {
  memory: FeedMemory;
  canDelete: boolean;
}) {
  const firstMedia = memory.media[0];

  return (
    <article className="mem-card overflow-hidden rounded-[1.6rem]">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            href={`/u/${memory.author.username}`}
            className="flex min-w-0 items-center gap-3"
          >
            <AuthorAvatar memory={memory} />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
                {memory.author.fullName} {" • "} {formatDate(memory.createdAt)}
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                @{memory.author.username} 
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {canDelete && (
              <DeleteMemoryButton memoryId={memory.id} type="memory" />
            )}

            <button
              type="button"
              className="text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              aria-label="More options"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {firstMedia && (
          <div className="mb-3 overflow-hidden rounded-[1.25rem] bg-[var(--app-surface-soft)]">
            {firstMedia.mediaKind === "image" ? (
              <Link href={`/memory/${memory.id}`}>
                <img
                  src={firstMedia.url}
                  alt={memory.title ?? "Memory media"}
                  className="h-[220px] w-full object-cover transition duration-300 hover:scale-[1.02] sm:h-[260px] xl:h-[240px]"
                />
              </Link>
            ) : firstMedia.mediaKind === "video" ? (
              <video
                src={firstMedia.url}
                className="h-[220px] w-full object-cover sm:h-[260px] xl:h-[240px]"
                controls
              />
            ) : (
              <Link
                href={`/memory/${memory.id}`}
                className="flex h-[220px] items-center justify-center bg-[var(--app-soft)] text-[var(--app-accent)]"
              >
                <ImagePlus />
              </Link>
            )}
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-2">
          {memory.moods.slice(0, 3).map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-2.5 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--app-muted)]">
            {formatPrivacy(memory.privacy)}
          </span>
        </div>

        <Link href={`/memory/${memory.id}`}>
          <h3 className="font-brand mb-1 text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
            {memory.title || "Untitled memory"}
          </h3>
        </Link>

        <p className="max-h-[72px] overflow-hidden text-sm leading-6 text-[var(--app-muted)]">
          {memory.content}
        </p>

        <MemoryEngagementBar
          memoryId={memory.id}
          initialLikeCount={memory.engagement.likeCount}
          initialReflectionCount={memory.engagement.reflectionCount}
          initiallyLiked={memory.engagement.viewerHasLiked}
          canEngage={memory.engagement.canEngage}
        />
      </div>
    </article>
  );
}

function AuthorAvatar({ memory }: { memory: FeedMemory }) {
  if (memory.author.avatarUrl) {
    return (
      <img
        src={memory.author.avatarUrl}
        alt={memory.author.fullName}
        className="size-10 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]">
      {memory.author.fullName[0] ?? "M"}
    </div>
  );
}

function EmptyFeed() {
  return (
    <section className="mem-card rounded-[1.6rem] p-4 text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={20} />
      </div>

      <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No memories yet
      </h2>

      <Link
        href="/create/memory"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
      >
        Write Memory
      </Link>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatPrivacy(value: FeedMemory["privacy"]) {
  const labels = {
    private: "Private",
    inner_circle: "Inner Circle",
    friends: "Friends",
    public: "Public",
    vault: "Vault",
  };

  return labels[value];
}
