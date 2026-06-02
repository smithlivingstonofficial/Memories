"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Globe2,
  LockKeyhole,
  Pencil,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { DeleteMomentButton } from "@/components/moments/delete-moment-button";
import { MarkMomentViewed } from "@/components/moments/mark-moment-viewed";
import type { MomentViewerData } from "@/lib/moments/get-moment-viewer-data";
import type { ActiveMoment } from "@/types/moment";

type MomentViewerScreenProps = {
  data: MomentViewerData;
};

const IMAGE_DURATION_MS = 7000;

export function MomentViewerScreen({ data }: MomentViewerScreenProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { moment, group, viewer, stats, navigation } = data;
  const firstMedia = moment.media[0];
  const isVideo = firstMedia?.mediaKind === "video";

  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const closeViewer = useCallback(() => {
    router.push("/home");
  }, [router]);

  const goNext = useCallback(() => {
    if (navigation.nextMomentId) {
      router.push(`/moment/${navigation.nextMomentId}`);
      return;
    }

    closeViewer();
  }, [navigation.nextMomentId, router, closeViewer]);

  const goPrevious = useCallback(() => {
    if (navigation.previousMomentId) {
      router.push(`/moment/${navigation.previousMomentId}`);
      return;
    }

    setProgress(0);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      void videoRef.current.play();
    }
  }, [navigation.previousMomentId, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProgress(0);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [moment.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeViewer, goNext, goPrevious]);

  useEffect(() => {
    if (isVideo) return;

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const nextProgress = Math.min(
        ((Date.now() - startedAt) / IMAGE_DURATION_MS) * 100,
        100
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        goNext();
      }
    }, 60);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isVideo, moment.id, goNext]);

  function handleVideoTimeUpdate() {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    setProgress(Math.min((video.currentTime / video.duration) * 100, 100));
  }

  function getSegmentProgress(index: number) {
    if (index < group.currentIndex) return 100;
    if (index > group.currentIndex) return 0;
    return progress;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!touchStart) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    setTouchStart(null);

    if (Math.abs(deltaY) > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
      closeViewer();
      return;
    }

    if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-[1280px]"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY,
        });
      }}
      onTouchEnd={handleTouchEnd}
    >
      <MarkMomentViewed momentId={moment.id} isOwner={viewer.isOwner} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mem-card overflow-hidden rounded-[2rem]">
          <header className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] p-4 sm:p-5">
            <button
              type="button"
              onClick={closeViewer}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
                <Clock3 size={14} />
                {formatTimeLeft(moment.expiresAt)}
              </span>

              <span className="hidden rounded-full bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] sm:inline-flex">
                {group.currentIndex + 1}/{group.totalCount}
              </span>

              {viewer.isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => router.push(`/moment/${moment.id}/edit`)}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
                    aria-label="Edit Moment"
                  >
                    <Pencil size={16} />
                  </button>
                  <DeleteMomentButton momentId={moment.id} />
                </>
              )}

              <button
                type="button"
                onClick={closeViewer}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                aria-label="Close Moment"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          <div className="relative bg-slate-950">
            <div className="absolute inset-x-0 top-0 z-30 flex gap-1 p-4">
              {group.moments.map((item, index) => (
                <div
                  key={item.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-75"
                    style={{ width: `${getSegmentProgress(index)}%` }}
                  />
                </div>
              ))}
            </div>

            {firstMedia?.mediaKind === "image" ? (
              <img
                src={firstMedia.url}
                alt={moment.caption ?? "Moment"}
                className="h-[calc(100vh-210px)] min-h-[520px] w-full object-contain"
              />
            ) : firstMedia?.mediaKind === "video" ? (
              <video
                ref={videoRef}
                src={firstMedia.url}
                className="h-[calc(100vh-210px)] min-h-[520px] w-full object-contain"
                controls
                autoPlay
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={goNext}
              />
            ) : (
              <div className="flex h-[calc(100vh-210px)] min-h-[520px] items-center justify-center text-white/70">
                No media found
              </div>
            )}

            <button
              type="button"
              onClick={goPrevious}
              className="absolute bottom-28 left-0 top-20 z-20 flex w-1/2 items-center justify-start px-4 text-white/0 transition hover:text-white/70"
              aria-label="Previous Moment"
            >
              <ChevronLeft size={32} />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute bottom-28 right-0 top-20 z-20 flex w-1/2 items-center justify-end px-4 text-white/0 transition hover:text-white/70"
              aria-label="Next Moment"
            >
              <ChevronRight size={32} />
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 sm:p-7">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <Avatar
                    fullName={moment.author.fullName}
                    avatarUrl={moment.author.avatarUrl}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {moment.author.fullName}
                    </p>
                    <p className="truncate text-xs text-white/65">
                      @{moment.author.username}
                    </p>
                  </div>
                </div>

                {moment.caption && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90 sm:text-base">
                    {moment.caption}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {moment.mood && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                      {moment.mood}
                    </span>
                  )}

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                    {getVisibilityLabel(moment.visibility)}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl sm:hidden">
                    {group.currentIndex + 1}/{group.totalCount}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl sm:hidden">
                    {formatTimeLeft(moment.expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-8 z-30 hidden -translate-x-1/2 rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-xl sm:block">
              Tap sides to move • Swipe down to close
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                fullName={moment.author.fullName}
                avatarUrl={moment.author.avatarUrl}
              />

              <div className="min-w-0">
                <h1 className="font-brand truncate text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  {moment.author.fullName}
                </h1>
                <p className="truncate text-sm text-[var(--app-muted)]">
                  @{moment.author.username}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/u/${moment.author.username}`)}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            >
              View Profile
            </button>
          </section>

          <section className="mem-card rounded-[2rem] p-5">
            <h2 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Moment group
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              Viewing {group.currentIndex + 1} of {group.totalCount} active
              Moments from this user.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={!navigation.previousMomentId}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
              >
                {navigation.nextMomentId ? "Next" : "Close"}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          <section className="mem-card rounded-[2rem] p-5">
            <h2 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Moment details
            </h2>

            <div className="mt-4 space-y-3">
              <DetailRow
                label="Visibility"
                value={getVisibilityLabel(moment.visibility)}
                icon={getVisibilityIcon(moment.visibility)}
              />

              <DetailRow
                label="Created"
                value={formatDate(moment.createdAt)}
                icon={Clock3}
              />

              <DetailRow
                label="Expires"
                value={formatTimeLeft(moment.expiresAt)}
                icon={Clock3}
              />

              {viewer.isOwner && (
                <DetailRow
                  label="Views"
                  value={`${stats.viewCount ?? 0}`}
                  icon={Eye}
                />
              )}
            </div>
          </section>

          {viewer.isOwner && (
            <section className="mem-card rounded-[2rem] p-5">
              <div className="flex items-start gap-3 rounded-[1.4rem] bg-[var(--app-soft)] p-4">
                <Eye
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--app-accent)]"
                />
                <p className="text-sm leading-6 text-[var(--app-muted)]">
                  View count only counts other users. Your own views are not
                  counted.
                </p>
              </div>
            </section>
          )}
        </aside>
      </section>
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
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="size-12 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--app-muted)]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--app-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function getVisibilityLabel(value: ActiveMoment["visibility"]) {
  const labels = {
    public: "Public",
    followers: "Followers",
    inner_circle: "Inner Circle",
    private: "Only me",
  };

  return labels[value];
}

function getVisibilityIcon(value: ActiveMoment["visibility"]) {
  const icons = {
    public: Globe2,
    followers: Users,
    inner_circle: Sparkles,
    private: LockKeyhole,
  };

  return icons[value];
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLeft(value: string) {
  const diff = new Date(value).getTime() - Date.now();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
