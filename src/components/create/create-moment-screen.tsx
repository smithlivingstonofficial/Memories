"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  GripVertical,
  ImagePlus,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { createMomentAction } from "@/app/actions/moments";
import {
  extractJpegGps,
  prepareMediaForUpload,
  type MediaOptimizationStatus,
} from "@/lib/media/client-media-processing";
import { takeCapturedMomentFile } from "@/lib/moments/captured-moment-media";
import { cn } from "@/lib/utils";
import {
  formatAutosaveStatus,
  useContentDraftAutosave,
} from "@/hooks/use-content-draft-autosave";
import type { ContentDraft } from "@/types/draft";

type CreateMomentScreenProps = {
  user: {
    id?: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  initialDraft?: ContentDraft | null;
};

type MediaKind = "image" | "video";
type MomentVisibility = "public" | "followers" | "inner_circle";
type CompressionState = "compressing" | "ready" | "failed";

type MomentMediaItem = {
  id: string;
  sourceFile: File;
  file: File | null;
  previewUrl: string;
  mediaKind: MediaKind;
  compressionState: CompressionState;
  optimizationStatus: MediaOptimizationStatus;
  originalSize: number;
  optimizedSize: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  latitude: number | null;
  longitude: number | null;
  message: string | null;
};

type UploadUrlResponse = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
  message?: string;
};

const MAX_MEDIA_ITEMS = 10;
const MAX_MOMENT_FILE_SIZE = 120 * 1024 * 1024;

const visibilityOptions: {
  value: MomentVisibility;
  label: string;
  description: string;
  icon: typeof Globe2;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone who can view your profile can see this Moment.",
    icon: Globe2,
  },
  {
    value: "followers",
    label: "Followers",
    description: "Only accepted followers can view this Moment.",
    icon: Users,
  },
  {
    value: "inner_circle",
    label: "Inner Circle",
    description: "Only people in your Inner Circle can view this Moment.",
    icon: Sparkles,
  },
];

export function CreateMomentScreen({
  user,
  initialDraft,
}: CreateMomentScreenProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const capturedMediaLoadedRef = useRef(false);
  const mediaItemsRef = useRef<MomentMediaItem[]>([]);

  const [mediaItems, setMediaItems] = useState<MomentMediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState(initialDraft?.caption ?? "");
  const [visibility, setVisibility] = useState<MomentVisibility>(
    isMomentVisibility(initialDraft?.visibility)
      ? initialDraft.visibility
      : "followers"
  );
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedVisibility = visibilityOptions.find(
    (option) => option.value === visibility
  );
  const selectedMedia =
    mediaItems.find((item) => item.id === selectedId) ?? mediaItems[0] ?? null;
  const readyCount = mediaItems.filter((item) => item.file).length;
  const compressingCount = mediaItems.filter(
    (item) => item.compressionState === "compressing"
  ).length;
  const publishableItems = mediaItems.filter(
    (item) =>
      item.file &&
      item.file.size <= MAX_MOMENT_FILE_SIZE &&
      item.compressionState !== "compressing"
  );
  const canPublish =
    title.trim().length > 0 &&
    mediaItems.length > 0 &&
    publishableItems.length === mediaItems.length &&
    !isPending;

  const autosave = useContentDraftAutosave({
    userId: user.id,
    initialDraftId: initialDraft?.id,
    draftType: "moment",
    payload: {
      caption: title,
      visibility,
      media: [],
    },
    hasMeaningfulContent: Boolean(user.id && title.trim()),
  });
  const autosaveLabel = formatAutosaveStatus(
    autosave.status,
    autosave.savedAt
  );

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    return () => {
      for (const item of mediaItemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (capturedMediaLoadedRef.current) return;
    capturedMediaLoadedRef.current = true;

    let cancelled = false;

    async function loadCapturedMedia() {
      try {
        const file = await takeCapturedMomentFile();
        if (!file || cancelled) return;
        void addFiles([file]);
      } catch {
        if (!cancelled) setMessage("Unable to load captured media.");
      }
    }

    void loadCapturedMedia();

    return () => {
      cancelled = true;
    };
    // Captured camera handoff is intentionally consumed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(files: File[]) {
    setMessage("");

    const remainingSlots = Math.max(0, MAX_MEDIA_ITEMS - mediaItems.length);
    const acceptedFiles = files
      .filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
      )
      .slice(0, remainingSlots);

    if (acceptedFiles.length === 0) {
      setMessage(
        remainingSlots === 0
          ? "Moments can include up to 10 media files."
          : "Please choose image or video files."
      );
      return;
    }

    const nextItems: MomentMediaItem[] = acceptedFiles.map((file) => {
      const mediaKind = file.type.startsWith("video/") ? "video" : "image";

      return {
        id: crypto.randomUUID(),
        sourceFile: file,
        file: null,
        previewUrl: URL.createObjectURL(file),
        mediaKind,
        compressionState: "compressing",
        optimizationStatus: "not_needed",
        originalSize: file.size,
        optimizedSize: file.size,
        width: null,
        height: null,
        durationSeconds: null,
        latitude: null,
        longitude: null,
        message: "Compressing in the background...",
      };
    });

    setMediaItems((current) => [...current, ...nextItems]);
    setSelectedId((current) => current ?? nextItems[0]?.id ?? null);

    await Promise.all(nextItems.map((item) => processMediaItem(item)));

    if (files.length > acceptedFiles.length) {
      setMessage(`Added ${acceptedFiles.length} media files. Maximum is 10.`);
    }
  }

  async function processMediaItem(item: MomentMediaItem) {
    try {
      const gps = await extractJpegGps(item.sourceFile);
      const prepared = await prepareMediaForUpload(item.sourceFile);
      const usable =
        prepared.file.size <= MAX_MOMENT_FILE_SIZE ||
        prepared.status === "failed";

      if (prepared.file.size > MAX_MOMENT_FILE_SIZE) {
        setMediaItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  file: null,
                  compressionState: "failed",
                  optimizationStatus: prepared.status,
                  originalSize: prepared.originalSize,
                  optimizedSize: prepared.optimizedSize,
                  latitude: gps?.latitude ?? null,
                  longitude: gps?.longitude ?? null,
                  message: "This media is still over 120 MB after compression.",
                }
              : currentItem
          )
        );
        return;
      }

      const nextPreviewUrl =
        prepared.file === item.sourceFile
          ? item.previewUrl
          : URL.createObjectURL(prepared.file);
      const metadata = await readMediaMetadata(nextPreviewUrl, item.mediaKind);

      setMediaItems((current) =>
        current.map((currentItem) => {
          if (currentItem.id !== item.id) return currentItem;

          if (nextPreviewUrl !== currentItem.previewUrl) {
            URL.revokeObjectURL(currentItem.previewUrl);
          }

          return {
            ...currentItem,
            file: prepared.file,
            previewUrl: nextPreviewUrl,
            compressionState:
              prepared.status === "failed" && usable ? "failed" : "ready",
            optimizationStatus: prepared.status,
            originalSize: prepared.originalSize,
            optimizedSize: prepared.optimizedSize,
            width: metadata.width,
            height: metadata.height,
            durationSeconds: metadata.durationSeconds,
            latitude: gps?.latitude ?? null,
            longitude: gps?.longitude ?? null,
            message:
              prepared.status === "optimized"
                ? `Reduced ${formatBytes(prepared.originalSize)} to ${formatBytes(
                    prepared.optimizedSize
                  )}.`
                : prepared.status === "failed"
                  ? "Compression failed; original will be used because it is under the limit."
                  : prepared.status === "not_needed"
                    ? "Already optimized enough."
                    : "Ready to upload.",
          };
        })
      );
    } catch (error) {
      setMediaItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                file:
                  item.sourceFile.size <= MAX_MOMENT_FILE_SIZE
                    ? item.sourceFile
                    : null,
                compressionState: "failed",
                optimizationStatus: "failed",
                message:
                  item.sourceFile.size <= MAX_MOMENT_FILE_SIZE
                    ? "Compression failed; original will be used because it is under the limit."
                    : error instanceof Error
                      ? error.message
                      : "Compression failed.",
              }
            : currentItem
        )
      );
    }
  }

  function removeMedia(itemId: string) {
    setMediaItems((current) => {
      const removed = current.find((item) => item.id === itemId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);

      const next = current.filter((item) => item.id !== itemId);
      if (selectedId === itemId) {
        setSelectedId(next[0]?.id ?? null);
      }

      return next;
    });
  }

  function resetMoment() {
    for (const item of mediaItems) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setMediaItems([]);
    setSelectedId(null);
    setTitle("");
    setMessage("");
  }

  function moveMedia(itemId: string, direction: -1 | 1) {
    setMediaItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  async function uploadPreparedMedia(item: MomentMediaItem) {
    if (!item.file) {
      throw new Error(`${item.sourceFile.name} is not ready yet.`);
    }

    const uploadUrlResponse = await fetch("/api/moments/upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: item.file.name,
        contentType: item.file.type,
        sizeBytes: item.file.size,
        mediaKind: item.mediaKind,
      }),
    });

    const uploadUrlResult =
      (await uploadUrlResponse.json()) as UploadUrlResponse;

    if (!uploadUrlResponse.ok) {
      throw new Error(uploadUrlResult.message || "Unable to prepare upload.");
    }

    const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": item.file.type,
      },
      body: item.file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Cloudflare R2 upload failed. Check your bucket CORS settings.");
    }

    return {
      objectKey: uploadUrlResult.objectKey,
      publicUrl: uploadUrlResult.publicUrl ?? "",
      mediaKind: item.mediaKind,
      mimeType: item.file.type,
      sizeBytes: item.file.size,
      width: item.width,
      height: item.height,
      durationSeconds: item.durationSeconds,
      mediaLatitude: item.latitude,
      mediaLongitude: item.longitude,
      originalSizeBytes: item.originalSize,
      optimizedSizeBytes: item.optimizedSize,
      optimizationStatus: item.optimizationStatus,
      usedForLocationSuggestion: item.latitude !== null && item.longitude !== null,
    };
  }

  function publishMoment() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Add a Moment title before publishing.");
      return;
    }

    if (mediaItems.length === 0) {
      setMessage("Select at least one photo or video.");
      return;
    }

    if (compressingCount > 0) {
      setMessage("Media compression is still running.");
      return;
    }

    if (publishableItems.length !== mediaItems.length) {
      setMessage("Remove media that failed or is over the upload limit.");
      return;
    }

    startTransition(async () => {
      try {
        setMessage("Uploading Moment media...");
        const uploadedMedia = [];

        for (const item of mediaItems) {
          uploadedMedia.push(await uploadPreparedMedia(item));
        }

        setMessage("Saving Moment...");

        const formData = new FormData();
        formData.append("draftId", autosave.draftId ?? initialDraft?.id ?? "");
        formData.append("caption", title.trim());
        formData.append("visibility", visibility);
        formData.append("media", JSON.stringify(uploadedMedia));

        const result = await createMomentAction(formData);

        if (!result.success) {
          throw new Error(result.message);
        }

        setMessage("Moment published.");
        router.push(`/moment/${result.momentId}`);
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to publish Moment."
        );
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-4.85rem)] min-h-0 w-full max-w-[1500px] flex-col overflow-hidden pb-[5.9rem] sm:mx-auto sm:h-[calc(100dvh-7.25rem)] sm:min-h-[680px] sm:pb-0 lg:h-[calc(100dvh-2rem)]">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <section className="hidden shrink-0 rounded-[1.05rem] p-2.5 sm:block sm:rounded-[1.7rem] sm:p-4 mem-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
            >
              <ArrowLeft size={16} />
              Back to Create
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center gap-2 md:flex">
            <ComposerChip label="Visible" value={selectedVisibility?.label ?? "Followers"} />
            <ComposerChip label="Media" value={`${readyCount}/${mediaItems.length}`} />
            <ComposerChip label="Life" value="24h" />
            {autosaveLabel && <ComposerChip label="Draft" value={autosaveLabel} />}
          </div>

          <button
            type="button"
            onClick={publishMoment}
            disabled={!canPublish}
            className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
          >
            {isPending ? <Loader2 size={17} className="animate-spin" /> : <ChevronRight size={17} />}
            <span className="hidden sm:inline">{isPending ? "Publishing" : "Publish"}</span>
          </button>
        </div>
      </section>

      <section className="mt-2 grid min-h-0 flex-1 gap-3 overflow-hidden sm:mt-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mem-card flex min-h-0 flex-col overflow-hidden rounded-[1.2rem] sm:rounded-[1.8rem]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] p-3 sm:gap-3 sm:p-4">
            <div className="min-w-0">
              <h1 className="truncate font-brand text-xl font-semibold text-[var(--app-text)] sm:text-2xl">
                {title.trim() || "Create Moment"}
              </h1>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)] sm:text-xs sm:tracking-[0.14em]">
                {readyCount}/{mediaItems.length} ready
                {compressingCount > 0 ? " - compressing" : " - 24h"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex size-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
                aria-label="Open camera"
              >
                <Camera size={18} />
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] sm:px-4"
              >
                <Upload size={17} />
                <span className="hidden min-[380px]:inline">Add media</span>
              </button>
            </div>
          </div>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col p-3 sm:p-4",
              dragActive && "bg-[var(--app-soft)]"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              void addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            {selectedMedia ? (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="relative aspect-[9/16] h-full max-h-full min-h-0 overflow-hidden rounded-[1.25rem] bg-slate-950 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:rounded-[1.45rem]">
                  {selectedMedia.mediaKind === "image" ? (
                    <Image
                      src={selectedMedia.previewUrl}
                      alt={title.trim() || "Moment preview"}
                      width={1200}
                      height={2133}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={selectedMedia.previewUrl}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                    />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5">
                    <p className="text-sm font-semibold text-white">@{user.username}</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">
                      {title.trim() || "New Memory"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                        {getVisibilityLabel(visibility)}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                        {selectedMedia.compressionState === "compressing"
                          ? "Compressing"
                          : selectedMedia.optimizationStatus === "optimized"
                            ? "Compressed"
                            : "Ready"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 text-center transition hover:border-[var(--app-accent)] sm:rounded-[1.45rem] sm:p-6"
              >
                <span className="mb-4 flex size-14 items-center justify-center rounded-[1.3rem] bg-[var(--app-soft)] text-[var(--app-accent)] sm:mb-5 sm:size-16 sm:rounded-[1.5rem]">
                  <ImagePlus size={25} />
                </span>
                <span className="font-brand text-xl font-semibold text-[var(--app-text)] sm:text-2xl">
                  Add photos or videos
                </span>
                <span className="mt-2 max-w-[15rem] text-sm leading-6 text-[var(--app-muted)] sm:max-w-md">
                  Choose media from your device. Compression starts immediately.
                </span>
              </button>
            )}

            <div className="mt-3 shrink-0 space-y-2 lg:hidden">
              <div className="rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Give this Moment a title"
                  className="h-10 w-full rounded-xl bg-transparent px-2 text-sm font-medium text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
                />
                <p className="px-2 text-right text-[11px] font-semibold text-[var(--app-muted)]">
                  {title.length}/120
                </p>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <button
                  type="button"
                  onClick={() => setVisibilityDialogOpen(true)}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--app-text)]">
                      {selectedVisibility?.label ?? "Followers"}
                    </span>
                    <span className="block truncate text-[11px] font-medium text-[var(--app-muted)]">
                      Visibility
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-[var(--app-muted)]" />
                </button>
                <button
                  type="button"
                  onClick={resetMoment}
                  disabled={isPending}
                  className="inline-flex size-12 items-center justify-center rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] disabled:opacity-60"
                  aria-label="Reset Moment"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>

              {message && (
                <p className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs leading-5 text-[var(--app-muted)]">
                  {message}
                </p>
              )}
            </div>

            {mediaItems.length > 0 && (
              <div className="mt-3 flex shrink-0 gap-3 overflow-x-auto pb-1">
                {mediaItems.map((item, index) => (
                  <MediaTile
                    key={item.id}
                    item={item}
                    index={index}
                    selected={item.id === selectedMedia?.id}
                    canMoveLeft={index > 0}
                    canMoveRight={index < mediaItems.length - 1}
                    onSelect={() => setSelectedId(item.id)}
                    onRemove={() => removeMedia(item.id)}
                    onMoveLeft={() => moveMedia(item.id, -1)}
                    onMoveRight={() => moveMedia(item.id, 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="hidden min-h-0 gap-3 overflow-y-auto pb-[7rem] lg:block lg:space-y-3 lg:pb-0">
          <section className="mem-card-strong rounded-[1.35rem] p-4 sm:rounded-[1.6rem]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <ImagePlus size={19} />
              </div>
              <div>
                <h2 className="font-brand text-xl font-semibold text-[var(--app-text)]">
                  Moment details
                </h2>
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
              Moment title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Give this Moment a title"
              className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"
            />
            <p className="mt-2 text-right text-xs text-[var(--app-muted)]">
              {title.length}/120
            </p>
          </section>

          <section className="mem-card-strong rounded-[1.35rem] p-4 sm:rounded-[1.6rem]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-brand text-lg font-semibold text-[var(--app-text)]">
                  Visibility
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  {selectedVisibility?.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVisibilityDialogOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 text-left transition hover:border-[var(--app-accent)]"
            >
              <span>
                <span className="block text-sm font-semibold text-[var(--app-text)]">
                  {selectedVisibility?.label}
                </span>
                <span className="mt-1 block text-xs text-[var(--app-muted)]">
                  Change who can see this post.
                </span>
              </span>
              <ChevronRight size={18} className="text-[var(--app-muted)]" />
            </button>
          </section>

          <section className="mem-card-strong rounded-[1.35rem] p-4 sm:rounded-[1.6rem]">
            <div className="flex items-center gap-3 rounded-[1.4rem] bg-[var(--app-surface-strong)] p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <Clock3 size={17} />
              </div>
              <p className="text-sm leading-6 text-[var(--app-muted)]">
                Moments stay active for 24 hours.
              </p>
            </div>

            {message && (
              <p className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-sm leading-6 text-[var(--app-muted)]">
                {message}
              </p>
            )}

            <div className="mt-5 hidden grid-cols-2 gap-3 sm:grid">
              <button
                type="button"
                onClick={resetMoment}
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60"
              >
                <RefreshCcw size={16} />
                Reset
              </button>
              <button
                type="button"
                onClick={publishMoment}
                disabled={!canPublish}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? <Loader2 size={17} className="animate-spin" /> : <ChevronRight size={17} />}
                {isPending ? "Publishing" : "Publish"}
              </button>
            </div>
          </section>
        </aside>
      </section>

      <div className="fixed inset-x-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
        <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
          {selectedVisibility?.label} - {readyCount}/{mediaItems.length} ready
          {compressingCount > 0 ? " - compressing" : ""}
        </p>
        <button
          type="button"
          onClick={publishMoment}
          disabled={!canPublish}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Publishing..." : "Publish Moment"}
          {!isPending && <ChevronRight size={17} />}
        </button>
      </div>

      <MomentVisibilityDialog
        isOpen={visibilityDialogOpen}
        selectedVisibility={visibility}
        onClose={() => setVisibilityDialogOpen(false)}
        onSelect={(nextVisibility) => {
          setVisibility(nextVisibility);
          setVisibilityDialogOpen(false);
        }}
      />
    </div>
  );
}

function MediaTile({
  item,
  index,
  selected,
  canMoveLeft,
  canMoveRight,
  onSelect,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  item: MomentMediaItem;
  index: number;
  selected: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative w-28 shrink-0 overflow-hidden rounded-[1.15rem] border bg-slate-950 sm:w-32",
        selected ? "border-[var(--app-accent)]" : "border-[var(--app-border)]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block aspect-[4/5] w-full"
        aria-label={`Select media ${index + 1}`}
      >
        {item.mediaKind === "image" ? (
          <Image
            src={item.previewUrl}
            alt={`Moment media ${index + 1}`}
            width={360}
            height={450}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={item.previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        )}
      </button>

      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xl">
        {selected ? <Check size={12} /> : <GripVertical size={12} />}
        {index + 1}
      </div>

      <div className="absolute inset-x-2 bottom-2 rounded-xl bg-black/60 p-2 text-[11px] text-white backdrop-blur-xl">
        <p className="truncate font-semibold">
          {item.compressionState === "compressing"
            ? "Compressing"
            : item.compressionState === "failed"
              ? "Fallback"
              : item.optimizationStatus === "optimized"
                ? "Compressed"
                : "Ready"}
        </p>
        <p className="truncate text-white/70">
          {item.message ?? formatBytes(item.optimizedSize)}
        </p>
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          className="flex size-8 items-center justify-center rounded-xl bg-black/55 text-white backdrop-blur-xl disabled:opacity-35"
          aria-label="Move media left"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          className="flex size-8 items-center justify-center rounded-xl bg-black/55 text-white backdrop-blur-xl disabled:opacity-35"
          aria-label="Move media right"
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-xl bg-black/55 text-white backdrop-blur-xl"
          aria-label="Remove media"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ComposerChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs text-[var(--app-muted)]">
      <span className="font-semibold uppercase tracking-[0.14em]">{label}</span>
      <strong className="font-brand text-sm font-semibold text-[var(--app-text)]">
        {value}
      </strong>
    </span>
  );
}

function MomentVisibilityDialog({
  isOpen,
  selectedVisibility,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  selectedVisibility: MomentVisibility;
  onClose: () => void;
  onSelect: (visibility: MomentVisibility) => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-visibility-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_90px_var(--app-shadow)] sm:rounded-[2rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="moment-visibility-dialog-title"
              className="font-brand text-xl font-semibold text-[var(--app-text)]"
            >
              Change visibility
            </h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Choose who can view this Moment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            aria-label="Close visibility selector"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-2">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            const selected = selectedVisibility === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.15rem] border p-3 text-left transition",
                  selected
                    ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                <Icon size={17} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">
                    {option.description}
                  </span>
                </span>
                {selected && <Check size={17} className="ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getVisibilityLabel(value: MomentVisibility) {
  return visibilityOptions.find((option) => option.value === value)?.label ?? "Followers";
}

function isMomentVisibility(value?: string | null): value is MomentVisibility {
  return value === "public" || value === "followers" || value === "inner_circle";
}

function readMediaMetadata(
  previewUrl: string,
  mediaKind: MediaKind
): Promise<Pick<MomentMediaItem, "width" | "height" | "durationSeconds">> {
  return new Promise((resolve, reject) => {
    if (mediaKind === "image") {
      const image = document.createElement("img");
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
          durationSeconds: null,
        });
      };
      image.onerror = () => reject(new Error("Unable to read image metadata."));
      image.src = previewUrl;
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSeconds: Number.isFinite(video.duration)
          ? Math.round(video.duration)
          : null,
      });
    };
    video.onerror = () => reject(new Error("Unable to read video metadata."));
    video.src = previewUrl;
  });
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(size) / Math.log(1024))
  );
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
