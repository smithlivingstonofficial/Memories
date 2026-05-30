import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  ImagePlus,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PenLine,
} from "lucide-react";
import { FollowProfileButton } from "@/components/profile/follow-profile-button";
import type { FeedMemory } from "@/types/memory";
import type { PublicProfilePageData } from "@/lib/profile/get-public-profile-page-data";

type PublicProfileScreenProps = {
  data: PublicProfilePageData;
};

export function PublicProfileScreen({ data }: PublicProfileScreenProps) {
  const { profile, viewer, stats, memories } = data;

  const isPrivateForViewer = !viewer.canViewProfileMemories;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <section className="mem-card overflow-hidden rounded-[2rem]">
        <div className="relative h-52 overflow-hidden sm:h-64">
          {profile.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt={`${profile.fullName} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full [background:var(--vault-hero)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <div className="absolute left-4 top-4">
            <Link
              href="/home"
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/30 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>

          <div className="absolute right-4 top-4">
            {viewer.isOwner ? (
              <Link
                href="/settings/profile"
                className="flex h-10 items-center gap-2 rounded-2xl border border-white/30 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white"
              >
                <Edit3 size={16} />
                Edit profile
              </Link>
            ) : (
              <div className="hidden sm:block">
                <FollowProfileButton
                  targetUserId={profile.id}
                  status={viewer.followStatus}
                  accountVisibility={profile.accountVisibility}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar
                fullName={profile.fullName}
                avatarUrl={profile.avatarUrl}
              />

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
                    {profile.fullName}
                  </h1>

                  {viewer.isOwner && (
                    <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                      You
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-[var(--app-muted)]">
                  @{profile.username}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
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

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                  {profile.bio ||
                    "No bio added yet. This user has not written a profile bio."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {viewer.isOwner ? (
                <Link
                  href="/profile"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
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

                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                  >
                    Message
                    <MessageCircle size={17} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ProfileStat
              label="Public memories"
              value={stats.publicMemories.toString()}
            />
            <ProfileStat
              label="Public media"
              value={stats.publicMedia.toString()}
            />
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
        className="size-28 shrink-0 rounded-[2rem] border-4 border-[var(--app-surface-strong)] object-cover shadow-[0_22px_60px_var(--app-shadow)] sm:size-32"
      />
    );
  }

  return (
    <div className="flex size-28 shrink-0 items-center justify-center rounded-[2rem] border-4 border-[var(--app-surface-strong)] bg-[var(--app-soft)] font-brand text-3xl font-semibold text-[var(--app-accent)] shadow-[0_22px_60px_var(--app-shadow)] sm:size-32">
      {initials}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        {value}
      </p>
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
            <img
              src={firstMedia.url}
              alt={memory.title ?? "Memory media"}
              className="h-full w-full object-cover"
            />
          ) : firstMedia.mediaKind === "video" ? (
            <video
              src={firstMedia.url}
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--app-accent)]">
              <ImagePlus />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center [background:var(--vault-hero)]">
          <ImagePlus className="text-[var(--app-accent)]" />
        </div>
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
          {formatDate(memory.createdAt)}
        </p>

        <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          {memory.title || "Untitled memory"}
        </h3>

        <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--app-muted)]">
          {memory.content}
        </p>

        {memory.locationName && (
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--app-muted)]">
            <MapPin size={14} />
            {memory.locationName}
          </p>
        )}
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

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}