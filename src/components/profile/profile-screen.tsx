import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Edit3,
  ImagePlus,
  LockKeyhole,
  MapPin,
  PenLine,
  Settings,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { MemoryEngagementBar } from "@/components/memory/memory-engagement-bar";
import type { FeedMemory } from "@/types/memory";
import type { ProfilePageData } from "@/lib/profile/get-profile-page-data";

type ProfileScreenProps = {
  data: ProfilePageData;
};

export function ProfileScreen({ data }: ProfileScreenProps) {
  const { profile, stats, memories } = data;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <section className="mem-card relative isolate overflow-hidden rounded-[2rem]">
        <div className="relative z-0 h-52 overflow-hidden sm:h-64">
          {profile.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt={`${profile.fullName} cover`}
              className="relative z-0 h-full w-full object-cover"
            />
          ) : (
            <div className="relative z-0 h-full w-full [background:var(--vault-hero)]" />
          )}

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <div className="absolute right-4 top-4 z-30 flex gap-2">
            <Link
              href="/settings/profile"
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/30 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
            >
              <Edit3 size={16} />
              Edit
            </Link>

            <Link
              href="/settings"
              className="flex size-10 items-center justify-center rounded-2xl border border-white/30 bg-white/80 text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
              aria-label="Settings"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        <div className="relative z-20 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <div className="-mt-16 sm:-mt-20">
                <Avatar
                  fullName={profile.fullName}
                  avatarUrl={profile.avatarUrl}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-brand text-3xl font-semibold text-[var(--app-text)] sm:text-4xl">
                    {profile.fullName}
                  </h1>

                  <span className="inline-flex rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                    {profile.accountVisibility === "private"
                      ? "Private account"
                      : "Public account"}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-[var(--app-muted)]">
                  @{profile.username}
                </p>

                <ProfileInlineStats
                  items={[
                    {
                      value: stats.memories,
                      singular: "Memory",
                      plural: "Memories",
                    },
                    {
                      value: stats.followers,
                      singular: "Follower",
                      plural: "Followers",
                    },
                    {
                      value: stats.following,
                      singular: "Following",
                      plural: "Following",
                    },
                    {
                      value: stats.media,
                      singular: "Media",
                      plural: "Media",
                    },
                  ]}
                />

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                  {profile.bio ||
                    "No bio added yet. Share a short line about your memories, life, or creative world."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href={`/u/${profile.username}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Public profile
              </Link>

              <Link
                href="/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)]"
              >
                Create
                <Sparkles size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-5">
          <div className="mem-card rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  <CalendarDays size={14} />
                  Profile Timeline
                </p>

                <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                  Your Memories
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                  Memories you created, excluding private Vault entries.
                </p>
              </div>

              <Link
                href="/create/memory"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                <PenLine size={16} />
                Write Memory
              </Link>
            </div>
          </div>

          {memories.length === 0 ? (
            <EmptyProfileMemories />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {memories.map((memory) => (
                <ProfileMemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <Bell size={18} />
              </div>

              <div>
                <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Follow Requests
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  {stats.pendingRequests} pending request
                  {stats.pendingRequests === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Sent" value={stats.sentRequests.toString()} />
              <MiniStat
                label="Pending"
                value={stats.pendingRequests.toString()}
              />
            </div>

            <Link
              href="/requests"
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
            >
              Manage Requests
              <UserCheck size={16} />
            </Link>
          </div>

          <div className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <LockKeyhole size={18} />
              </div>

              <div>
                <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Vault
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  Private diary space
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-[var(--app-muted)]">
              Your Vault entries are not shown on your profile or Home feed.
              They stay visible only to you.
            </p>

            <Link
              href="/vault"
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-heading)] text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              Open Vault
              <LockKeyhole size={16} />
            </Link>
          </div>

          <div className="mem-card rounded-[2rem] p-5">
            <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Social foundation
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
              Next we will add Discover People, likes, reflections, messages,
              and Moments.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Avatar({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
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
        className="relative z-20 size-28 shrink-0 rounded-[2rem] border-4 border-[var(--app-surface-strong)] object-cover shadow-[0_22px_60px_var(--app-shadow)] sm:size-32"
      />
    );
  }

  return (
    <div className="relative z-20 flex size-28 shrink-0 items-center justify-center rounded-[2rem] border-4 border-[var(--app-surface-strong)] bg-[var(--app-soft)] font-brand text-3xl font-semibold text-[var(--app-accent)] shadow-[0_22px_60px_var(--app-shadow)] sm:size-32">
      {initials}
    </div>
  );
}

function ProfileInlineStats({
  items,
}: {
  items: Array<{
    value: number;
    singular: string;
    plural: string;
  }>;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--app-muted)]">
      {items.map((item) => (
        <span
          key={item.plural}
          className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5"
        >
          <strong className="font-brand text-base font-semibold text-[var(--app-text)]">
            {item.value}
          </strong>
          <span>{item.value === 1 ? item.singular : item.plural}</span>
        </span>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-xl font-semibold text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function ProfileMemoryCard({ memory }: { memory: FeedMemory }) {
  const firstMedia = memory.media[0];

  return (
    <article className="mem-card relative overflow-hidden rounded-[2rem]">
      <div className="absolute right-3 top-3 z-10">
        <DeleteMemoryButton memoryId={memory.id} type="memory" />
      </div>

      {firstMedia ? (
        <div className="h-64 overflow-hidden bg-[var(--app-surface-soft)]">
          {firstMedia.mediaKind === "image" ? (
            <Link href={`/memory/${memory.id}`}>
              <img
                src={firstMedia.url}
                alt={memory.title ?? "Memory media"}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
              />
            </Link>
          ) : firstMedia.mediaKind === "video" ? (
            <video
              src={firstMedia.url}
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <Link
              href={`/memory/${memory.id}`}
              className="flex h-full items-center justify-center text-[var(--app-accent)]"
            >
              <ImagePlus />
            </Link>
          )}
        </div>
      ) : (
        <Link
          href={`/memory/${memory.id}`}
          className="flex h-64 items-center justify-center [background:var(--vault-hero)]"
        >
          <ImagePlus className="text-[var(--app-accent)]" />
        </Link>
      )}

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {memory.moods.slice(0, 3).map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
          {formatDate(memory.createdAt)}
        </p>

        <Link href={`/memory/${memory.id}`}>
          <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
            {memory.title || "Untitled memory"}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--app-muted)]">
          {memory.content}
        </p>

        {memory.locationName && (
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--app-muted)]">
            <MapPin size={14} />
            {memory.locationName}
          </p>
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

function EmptyProfileMemories() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No memories on your profile yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Write your first memory and it will appear here. Vault entries will stay
        private inside Vault.
      </p>

      <Link
        href="/create/memory"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
      >
        Write Memory
        <PenLine size={17} />
      </Link>
    </section>
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
