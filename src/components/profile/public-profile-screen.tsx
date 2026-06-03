import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  ImagePlus,
  LockKeyhole,
  MapPin,
  PenLine,
} from "lucide-react";
import { FollowProfileButton } from "@/components/profile/follow-profile-button";
import { MemoryEngagementBar } from "@/components/memory/memory-engagement-bar";
import type { FeedMemory } from "@/types/memory";
import type { PublicProfilePageData } from "@/lib/profile/get-public-profile-page-data";
import { StartConversationButton } from "@/components/messages/start-conversation-button";

type PublicProfileScreenProps = {
  data: PublicProfilePageData;
};

export function PublicProfileScreen({ data }: PublicProfileScreenProps) {
  const { profile, viewer, stats, memories } = data;

  const isPrivateForViewer = !viewer.canViewProfileMemories;

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

          <div className="absolute left-4 top-4 z-30">
            <Link
              href="/home"
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/30 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>

          <div className="absolute right-4 top-4 z-30">
            {viewer.isOwner && (
              <Link
                href="/settings/profile"
                className="flex h-10 items-center gap-2 rounded-2xl border border-white/30 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
              >
                <Edit3 size={16} />
                Edit profile
              </Link>
            )}
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

                  {viewer.isOwner && (
                    <span className="inline-flex rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                      You
                    </span>
                  )}

                  <span className="inline-flex rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                    {profile.accountVisibility === "private"
                      ? "Private account"
                      : "Public account"}
                  </span>

                  {!viewer.isOwner && viewer.followStatus === "following" && (
                    <span className="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                      Following
                    </span>
                  )}

                  {!viewer.isOwner && viewer.followStatus === "requested" && (
                    <span className="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                      Requested
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-[var(--app-muted)]">
                  @{profile.username}
                </p>

                <ProfileInlineStats
                  items={[
                    {
                      value: stats.publicMemories,
                      singular: "Public memory",
                      plural: "Public memories",
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
                      value: stats.publicMedia,
                      singular: "Public media",
                      plural: "Public media",
                    },
                  ]}
                />

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                  {profile.bio ||
                    "No bio added yet. This user has not written a profile bio."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              {viewer.isOwner ? (
                <Link
                  href="/profile"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                >
                  View private profile
                  <LockKeyhole size={16} />
                </Link>
              ) : (
                <>
                  <FollowProfileButton
                    targetUserId={profile.id}
                    status={viewer.followStatus}
                    accountVisibility={profile.accountVisibility}
                  />

                  <StartConversationButton targetUserId={profile.id} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mem-card rounded-[2rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <CalendarDays size={14} />
              Public Timeline
            </p>

            <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
              Public Memories
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              {isPrivateForViewer
                ? "This user's memories are hidden because their account is private."
                : "Only memories this user shared publicly are shown here."}
            </p>
          </div>

          {viewer.isOwner && (
            <Link
              href="/create/memory"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            >
              <PenLine size={16} />
              Write Memory
            </Link>
          )}
        </div>
      </section>

      {isPrivateForViewer ? (
        <PrivateAccountNotice followStatus={viewer.followStatus} />
      ) : memories.length === 0 ? (
        <EmptyPublicProfile isOwner={viewer.isOwner} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {memories.map((memory) => (
            <PublicMemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}
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

function PublicMemoryCard({ memory }: { memory: FeedMemory }) {
  const firstMedia = memory.media[0];

  return (
    <article className="mem-card overflow-hidden rounded-[2rem]">
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

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
            Public
          </span>
        </div>

        <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
          {formatMemoryDate(memory)}
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

function EmptyPublicProfile({ isOwner }: { isOwner: boolean }) {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No public memories yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        {isOwner
          ? "You have not shared any public memories yet. Private and Vault memories are hidden from this page."
          : "This user has not shared any public memories yet."}
      </p>

      {isOwner && (
        <Link
          href="/create/memory"
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
        >
          Write Public Memory
          <PenLine size={17} />
        </Link>
      )}
    </section>
  );
}

function PrivateAccountNotice({
  followStatus,
}: {
  followStatus: "self" | "not_following" | "requested" | "following";
}) {
  const description =
    followStatus === "requested"
      ? "Your follow request has been sent. If this user accepts it, you will be able to see their shared memories."
      : "Send a follow request to this user. If they accept, you will be able to see their shared memories.";

  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <LockKeyhole size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        This account is private
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        {description}
      </p>
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
