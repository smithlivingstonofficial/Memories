import Link from "next/link";
import {
  Clock3,
  ImagePlus,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { HomeMomentsRealtimeRefresh } from "@/components/home/home-moments-realtime-refresh";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { MemoryEngagementBar } from "@/components/memory/memory-engagement-bar";
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
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <HomeMomentsRealtimeRefresh />

      <div className="min-w-0 space-y-5">
        <MomentsTray
          activeMoments={activeMoments}
          currentUserId={currentUserId}
        />

        {memories.length === 0 ? (
          <EmptyFeed />
        ) : (
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

      <aside className="hidden space-y-5 xl:block">
        <div className="mem-card rounded-[2rem] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-surface-strong)] text-[var(--app-accent)]">
              <LockKeyhole size={18} />
            </div>

            <div>
              <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Vault
              </h3>
              <p className="text-xs text-[var(--app-muted)]">
                Your private world
              </p>
            </div>
          </div>

          <p className="text-sm leading-6 text-[var(--app-muted)]">
            Write private memories visible only to you. No likes. No public
            pressure.
          </p>

          <Link
            href="/create/vault"
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-heading)] text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
          >
            Write in Vault
            <Sparkles size={16} />
          </Link>
        </div>

        <div className="mem-card rounded-[2rem] p-5">
          <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Today’s reflection
          </h3>

          <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
            What is one small moment from today that you want to remember?
          </p>

          <div className="mt-5 rounded-[1.4rem] bg-[var(--app-soft)] p-4 text-sm leading-6 text-[var(--app-accent)]">
            “Small moments become meaningful when we pause to keep them.”
          </div>
        </div>
      </aside>
    </div>
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
    <section className="mem-card overflow-hidden rounded-[2rem]">
      <div className="border-b border-[var(--app-border)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Moments
              </h2>

              {activeMoments.length > 0 && (
                <span className="rounded-full bg-[var(--app-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  Live
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              Active 24-hour updates from you and your people.
            </p>
          </div>

          <Link
            href="/create/moment"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-white shadow-[0_18px_40px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)]"
            aria-label="Create Moment"
          >
            <Plus size={19} />
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
          <YourMomentCard group={myGroup} />

          {otherGroups.map((group) => (
            <MomentGroupItem key={group.ownerId} group={group} />
          ))}
        </div>

        {groupedMoments.length === 0 && (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
              <Clock3 size={18} />
            </div>

            <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              No active Moments yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--app-muted)]">
              Create a quick photo or video Moment to appear here.
            </p>
          </div>
        )}
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
            <div className="rounded-[1.65rem] bg-gradient-to-br from-[#6366F1] via-[#A5B4FC] to-[#FFE4E6] p-[2px]">
              <div className="relative size-[84px] overflow-hidden rounded-[1.55rem] bg-[var(--app-surface-strong)]">
                {firstMedia?.mediaKind === "image" ? (
                  <img
                    src={firstMedia.url}
                    alt={group.latestMoment.caption ?? "Your Moment"}
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
                    <ImagePlus size={20} />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-1.5">
                  <p className="truncate text-[10px] font-semibold text-white">
                    {group.moments.length > 1
                      ? `${group.moments.length} Moments`
                      : group.latestMoment.mood ?? "Moment"}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/create/moment"
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl border-2 border-[var(--app-surface-strong)] bg-[var(--app-accent)] text-white shadow-lg"
            aria-label="Add another Moment"
          >
            <Plus size={15} />
          </Link>
        </div>

        <p className="mt-2 max-w-[84px] truncate text-xs font-semibold text-[var(--app-text)]">
          Your Moment
        </p>
      </div>
    );
  }

  return (
    <Link href="/create/moment" className="shrink-0 text-center">
      <div className="rounded-[1.65rem] bg-[var(--app-border)] p-[2px]">
        <div className="flex size-[84px] items-center justify-center rounded-[1.55rem] bg-[var(--app-surface-strong)] text-[var(--app-accent)]">
          <Plus size={22} />
        </div>
      </div>

      <p className="mt-2 max-w-[84px] truncate text-xs font-semibold text-[var(--app-muted)]">
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
      <div className="rounded-[1.65rem] bg-gradient-to-br from-[#6366F1] via-[#A5B4FC] to-[#FFE4E6] p-[2px]">
        <div className="relative size-[84px] overflow-hidden rounded-[1.55rem] bg-[var(--app-surface-strong)]">
          {firstMedia?.mediaKind === "image" ? (
            <img
              src={firstMedia.url}
              alt={group.latestMoment.caption ?? "Moment"}
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
              <ImagePlus size={20} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-1.5">
            <p className="truncate text-[10px] font-semibold text-white">
              {group.moments.length > 1
                ? `${group.moments.length} Moments`
                : group.latestMoment.mood ?? "Moment"}
            </p>
          </div>

          {group.author.avatarUrl && (
            <img
              src={group.author.avatarUrl}
              alt={group.author.fullName}
              className="absolute left-1.5 top-1.5 size-6 rounded-lg border border-white/70 object-cover"
            />
          )}
        </div>
      </div>

      <p className="mt-2 max-w-[84px] truncate text-xs font-medium text-[var(--app-muted)]">
        {group.author.fullName}
      </p>
    </Link>
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
    <article className="mem-card overflow-hidden rounded-[2rem]">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/u/${memory.author.username}`}
            className="flex min-w-0 items-center gap-3"
          >
            <AuthorAvatar memory={memory} />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
                {memory.author.fullName}
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                @{memory.author.username} • {formatDate(memory.createdAt)}
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
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>

        {firstMedia ? (
          <div className="mb-4 overflow-hidden rounded-[1.6rem] bg-[var(--app-surface-soft)]">
            {firstMedia.mediaKind === "image" ? (
              <Link href={`/memory/${memory.id}`}>
                <img
                  src={firstMedia.url}
                  alt={memory.title ?? "Memory media"}
                  className="h-[280px] w-full object-cover transition duration-300 hover:scale-[1.02] sm:h-[330px] lg:h-[300px] xl:h-[320px]"
                />
              </Link>
            ) : firstMedia.mediaKind === "video" ? (
              <video
                src={firstMedia.url}
                className="h-[280px] w-full object-cover sm:h-[330px] lg:h-[300px] xl:h-[320px]"
                controls
              />
            ) : (
              <Link
                href={`/memory/${memory.id}`}
                className="flex h-[280px] items-center justify-center bg-[var(--app-soft)] text-[var(--app-accent)]"
              >
                <ImagePlus />
              </Link>
            )}
          </div>
        ) : (
          <Link
            href={`/memory/${memory.id}`}
            className="mb-4 flex h-[280px] items-center justify-center rounded-[1.6rem] [background:var(--vault-hero)] sm:h-[330px] lg:h-[300px] xl:h-[320px]"
          >
            <ImagePlus className="text-[var(--app-accent)]" />
          </Link>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {memory.moods.map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
            {formatPrivacy(memory.privacy)}
          </span>
        </div>

        <Link href={`/memory/${memory.id}`}>
          <h3 className="font-brand mb-2 text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
            {memory.title || "Untitled memory"}
          </h3>
        </Link>

        <p className="text-[15px] leading-7 text-[var(--app-muted)]">
          {memory.content}
        </p>

        {memory.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

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
        className="size-11 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]">
      {memory.author.fullName[0] ?? "M"}
    </div>
  );
}

function EmptyFeed() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No memories yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Create your first memory with words, mood, privacy, and media. It will
        appear here after saving.
      </p>

      <Link
        href="/create/memory"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
      >
        Write your first Memory
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