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
    <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5">
      <section className="mem-card relative isolate overflow-hidden rounded-[1.5rem] sm:rounded-[1.8rem]">
        <div className="relative z-0 h-36 overflow-hidden sm:h-48 lg:h-52">
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

          <div className="absolute right-3 top-3 z-30 flex gap-2 sm:right-4 sm:top-4">
            <Link
              href="/settings/profile"
              className="flex h-9 items-center gap-2 rounded-2xl border border-white/30 bg-white/85 px-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white sm:h-10 sm:px-4"
            >
              <Edit3 size={16} />
              Edit
            </Link>

            <Link
              href="/settings"
              className="flex size-9 items-center justify-center rounded-2xl border border-white/30 bg-white/85 text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white sm:size-10"
              aria-label="Settings"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        <div className="relative z-20 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 pb-3.5 sm:px-5 sm:pb-5">
          <div className="grid gap-4 pt-3.5 sm:pt-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
            <div className="min-w-0 sm:hidden">
              <div className="flex min-w-0 gap-3">
                <div className="-mt-10 shrink-0">
                  <Avatar
                    fullName={profile.fullName}
                    avatarUrl={profile.avatarUrl}
                  />
                </div>

                <div className="min-w-0 pt-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="font-brand truncate text-2xl font-semibold tracking-[-0.055em] text-[var(--app-text)]">
                      {profile.fullName}
                    </h1>
                    <VisibilityBadge visibility={profile.accountVisibility} />
                  </div>

                  <p className="mt-0.5 truncate text-sm font-medium text-[var(--app-muted)]">
                    @{profile.username}
                  </p>
                </div>
              </div>

              <ProfileInlineStats
                layout="mobile"
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
                ]}
              />

              {profile.bio && (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="hidden min-w-0 gap-3 sm:flex sm:gap-4">
              <div className="-mt-10 shrink-0 sm:-mt-14">
                <Avatar
                  fullName={profile.fullName}
                  avatarUrl={profile.avatarUrl}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="font-brand text-2xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
                    {profile.fullName}
                  </h1>
                  <VisibilityBadge visibility={profile.accountVisibility} />
                </div>

                <p className="mt-0.5 text-sm font-medium text-[var(--app-muted)]">
                  @{profile.username}
                </p>

                <ProfileInlineStats
                  layout="desktop"
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
                  ]}
                />

                {profile.bio && (
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:justify-end">
              <Link
                href={`/u/${profile.username}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:h-11 sm:px-5"
              >
                Public profile
              </Link>

              <Link
                href="/create"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.22)] transition hover:bg-[var(--app-accent-hover)] sm:h-11 sm:px-5"
              >
                Create
                <Sparkles size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-4 sm:space-y-5">
          <div className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  <CalendarDays size={14} />
                  Timeline
                </p>

                <h2 className="font-brand text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-2xl">
                  Your Memories
                </h2>
              </div>

              <Link
                href="/create/memory"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:h-11 sm:px-4"
              >
                <PenLine size={16} />
                <span className="hidden sm:inline">Write Memory</span>
                <span className="sm:hidden">Write</span>
              </Link>
            </div>
          </div>

          {memories.length === 0 ? (
            <EmptyProfileMemories />
          ) : (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {memories.map((memory) => (
                <ProfileMemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 sm:space-y-5">
          <div className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <Bell size={17} />
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
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] sm:h-11"
            >
              Manage Requests
              <UserCheck size={16} />
            </Link>
          </div>

          <div className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <LockKeyhole size={17} />
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

            <Link
              href="/vault"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-heading)] text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90 sm:h-11"
            >
              Open Vault
              <LockKeyhole size={16} />
            </Link>
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
        className="relative z-20 size-20 shrink-0 rounded-[1.45rem] border-4 border-[var(--app-surface-strong)] object-cover shadow-[0_18px_44px_var(--app-shadow)] sm:size-24 sm:rounded-[1.7rem]"
      />
    );
  }

  return (
    <div className="relative z-20 flex size-20 shrink-0 items-center justify-center rounded-[1.45rem] border-4 border-[var(--app-surface-strong)] bg-[var(--app-soft)] font-brand text-2xl font-semibold text-[var(--app-accent)] shadow-[0_18px_44px_var(--app-shadow)] sm:size-24 sm:rounded-[1.7rem]">
      {initials}
    </div>
  );
}

function VisibilityBadge({
  visibility,
}: {
  visibility: "public" | "private";
}) {
  const isPrivate = visibility === "private";

  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-soft)] text-[var(--app-accent)]"
      title={isPrivate ? "Private account" : "Public account"}
      aria-label={isPrivate ? "Private account" : "Public account"}
    >
      {isPrivate ? <LockKeyhole size={15} /> : <UserCheck size={15} />}
    </span>
  );
}

function ProfileInlineStats({
  items,
  layout = "desktop",
}: {
  items: Array<{
    value: number;
    singular: string;
    plural: string;
  }>;
  layout?: "mobile" | "desktop";
}) {
  if (layout === "mobile") {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <span
            key={item.plural}
            className="min-w-0 rounded-[1.05rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-2 py-2 text-center"
          >
            <strong className="block font-brand text-base font-semibold leading-none text-[var(--app-text)]">
              {item.value}
            </strong>
            <span className="mt-1 block text-[11px] font-medium leading-tight text-[var(--app-muted)]">
              {item.value === 1 ? item.singular : item.plural}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--app-muted)] sm:mt-3">
      {items.map((item) => (
        <span
          key={item.plural}
          className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-2.5 py-1 sm:px-3 sm:py-1.5"
        >
          <strong className="font-brand text-sm font-semibold text-[var(--app-text)] sm:text-base">
            {item.value}
          </strong>
          <span className="text-xs sm:text-sm">
            {item.value === 1 ? item.singular : item.plural}
          </span>
        </span>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2.5 sm:rounded-[1.25rem] sm:p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)] sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1 font-brand text-xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function ProfileMemoryCard({ memory }: { memory: FeedMemory }) {
  const firstMedia = memory.media[0];

  return (
    <article className="mem-card relative overflow-hidden rounded-[1.6rem] sm:rounded-[1.8rem]">
      <div className="absolute right-3 top-3 z-10">
        <DeleteMemoryButton memoryId={memory.id} type="memory" />
      </div>

      {firstMedia ? (
        <div className="h-52 overflow-hidden bg-[var(--app-surface-soft)] sm:h-60">
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
          className="flex h-52 items-center justify-center [background:var(--vault-hero)] sm:h-60"
        >
          <ImagePlus className="text-[var(--app-accent)]" />
        </Link>
      )}

      <div className="p-3.5 sm:p-4">
        <div className="mb-2 flex flex-wrap gap-2 sm:mb-3">
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
          {formatMemoryDate(memory)}
        </p>

        <Link href={`/memory/${memory.id}`}>
          <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
            {memory.title || "Untitled memory"}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--app-muted)]">
          {memory.content}
        </p>

        {memory.locationName && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--app-muted)]">
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
    <section className="mem-card rounded-[1.6rem] p-6 text-center sm:rounded-[2rem] sm:p-8">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)] sm:mb-5">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-2xl">
        No memories on your profile yet
      </h2>

      <Link
        href="/create/memory"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] sm:h-12"
      >
        Write Memory
        <PenLine size={17} />
      </Link>
    </section>
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
