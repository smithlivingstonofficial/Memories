"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import { createMomentAction } from "@/app/actions/moments";

type CreateMomentScreenProps = {
  user: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
};

type MediaKind = "image" | "video";

type MomentVisibility = "public" | "followers" | "inner_circle" | "private";

type MediaMetadata = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

type UploadUrlResponse = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
  message?: string;
};

const visibilityOptions: {
  value: MomentVisibility;
  label: string;
  description: string;
  icon: typeof Globe2;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Visible to people who can view your public profile.",
    icon: Globe2,
  },
  {
    value: "followers",
    label: "Followers",
    description: "Only accepted followers can view.",
    icon: Users,
  },
  {
    value: "inner_circle",
    label: "Inner Circle",
    description: "Only your trusted circle can view.",
    icon: Sparkles,
  },
  {
    value: "private",
    label: "Only me",
    description: "Private Moment visible only to you.",
    icon: LockKeyhole,
  },
];

const moods = [
  "Peaceful",
  "Happy",
  "Grateful",
  "Blessed",
  "Loved",
  "Calm",
  "Hopeful",
  "Excited",
];

export function CreateMomentScreen({ user }: CreateMomentScreenProps) {
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata>({
    width: null,
    height: null,
    durationSeconds: null,
  });

  const [caption, setCaption] = useState("");
  const [selectedMood, setSelectedMood] = useState("Peaceful");
  const [visibility, setVisibility] =
    useState<MomentVisibility>("followers");
  const [message, setMessage] = useState("");

  const [isPending, startTransition] = useTransition();

  const hasMedia = Boolean(selectedFile && previewUrl && mediaKind);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleMediaFile(file: File | null) {
    setMessage("");

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setMessage("Please choose an image or video file.");
      return;
    }

    const maxSize = 120 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Moment media should be less than 120 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    const nextMediaKind = isImage ? "image" : "video";

    setSelectedFile(file);
    setMediaKind(nextMediaKind);
    setPreviewUrl(nextPreviewUrl);
    setMediaMetadata({
      width: null,
      height: null,
      durationSeconds: null,
    });

    try {
      const metadata = await readMediaMetadata(nextPreviewUrl, nextMediaKind);
      setMediaMetadata(metadata);
    } catch {
      setMediaMetadata({
        width: null,
        height: null,
        durationSeconds: null,
      });
    }
  }

  function resetMedia() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setMediaKind(null);
    setPreviewUrl("");
    setMediaMetadata({
      width: null,
      height: null,
      durationSeconds: null,
    });
    setMessage("");
  }

  async function publishMoment() {
    setMessage("");

    if (!selectedFile || !mediaKind) {
      setMessage("Add a photo or video before publishing a Moment.");
      return;
    }

    startTransition(async () => {
      try {
        setMessage("Preparing secure upload...");

        const uploadUrlResponse = await fetch("/api/moments/upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            sizeBytes: selectedFile.size,
            mediaKind,
          }),
        });

        const uploadUrlResult =
          (await uploadUrlResponse.json()) as UploadUrlResponse;

        if (!uploadUrlResponse.ok) {
          throw new Error(
            uploadUrlResult.message || "Unable to prepare upload."
          );
        }

        setMessage("Uploading Moment media...");

        const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedFile.type,
          },
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            "Cloudflare R2 upload failed. Check your bucket CORS settings."
          );
        }

        setMessage("Saving Moment...");

        const formData = new FormData();
        formData.append("objectKey", uploadUrlResult.objectKey);
        formData.append("publicUrl", uploadUrlResult.publicUrl ?? "");
        formData.append("mediaKind", mediaKind);
        formData.append("mimeType", selectedFile.type);
        formData.append("sizeBytes", String(selectedFile.size));
        formData.append("width", String(mediaMetadata.width ?? ""));
        formData.append("height", String(mediaMetadata.height ?? ""));
        formData.append(
          "durationSeconds",
          String(mediaMetadata.durationSeconds ?? "")
        );
        formData.append("caption", caption.trim());
        formData.append("mood", selectedMood);
        formData.append("visibility", visibility);

        const result = await createMomentAction(formData);

        if (!result.success) {
          throw new Error(result.message);
        }

        setMessage("Moment published.");
        router.push("/home");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to publish Moment."
        );
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleMediaFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          void handleMediaFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                <ArrowLeft size={14} />
                Back to Create
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
                <Sparkles size={14} />
                Moment Creator
              </span>
            </div>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.06em] text-[var(--app-text)] sm:text-4xl lg:text-5xl">
              Capture a Moment.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-muted)] sm:text-base">
              Publish a quick photo or video that stays active for 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <StatCard label="Duration" value="24h" />
            <StatCard label="Media" value={hasMedia ? "1" : "0"} />
            <StatCard label="Status" value={isPending ? "Saving" : "Ready"} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <div className="mem-card overflow-hidden rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] p-4 sm:p-5">
            <div>
              <p className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Media preview
              </p>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Use camera on mobile or upload from your device.
              </p>
            </div>

            {hasMedia && (
              <button
                type="button"
                onClick={resetMedia}
                disabled={isPending}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-rose-500 disabled:opacity-60"
                aria-label="Remove media"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleMediaFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className="p-4 sm:p-5"
          >
            {hasMedia ? (
              <div className="relative overflow-hidden rounded-[1.8rem] bg-slate-950">
                {mediaKind === "image" ? (
                  <img
                    src={previewUrl}
                    alt="Moment preview"
                    className="h-[520px] w-full object-contain"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="h-[520px] w-full object-contain"
                    controls
                    playsInline
                  />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
                  <div className="max-w-xl">
                    <p className="text-sm font-semibold text-white">
                      @{user.username}
                    </p>

                    {caption.trim() ? (
                      <p className="mt-2 text-sm leading-6 text-white/90">
                        {caption.trim()}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        Your caption preview will appear here.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                        {selectedMood}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xl">
                        {getVisibilityLabel(visibility)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <ImagePlus size={28} />
                </div>

                <h2 className="font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                  Add your Moment
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
                  Capture instantly using camera or upload an image/video.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)]"
                  >
                    <Camera size={17} />
                    Open camera
                  </button>

                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                  >
                    <Upload size={17} />
                    Upload media
                  </button>
                </div>

                <p className="mt-5 text-xs text-[var(--app-faint)]">
                  Drag and drop also works on desktop.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <Camera size={19} />
              </div>

              <div>
                <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Moment details
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Keep it short and meaningful.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
                Caption
              </label>

              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={280}
                rows={5}
                placeholder="What happened in this moment?"
                className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm leading-7 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"
              />

              <p className="mt-2 text-right text-xs text-[var(--app-muted)]">
                {caption.length}/280
              </p>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-[var(--app-text)]">
                Mood
              </p>

              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    disabled={isPending}
                    className={
                      selectedMood === mood
                        ? "rounded-full bg-[var(--app-accent)] px-3 py-2 text-xs font-semibold text-white"
                        : "rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                    }
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <ShieldCheck size={19} />
              </div>

              <div>
                <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Visibility
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Choose who can view this Moment.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const active = visibility === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    disabled={isPending}
                    className={
                      active
                        ? "flex w-full items-start gap-3 rounded-2xl border border-[var(--app-accent)] bg-[var(--app-soft)] p-4 text-left"
                        : "flex w-full items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 text-left transition hover:border-[var(--app-accent)]"
                    }
                  >
                    <span
                      className={
                        active
                          ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white"
                          : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-muted)]"
                      }
                    >
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--app-text)]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--app-muted)]">
                        {option.description}
                      </span>
                    </span>

                    {active && (
                      <Check size={17} className="text-[var(--app-accent)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mem-card rounded-[2rem] p-5">
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

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={resetMedia}
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60"
              >
                <RefreshCcw size={16} />
                Reset
              </button>

              <button
                type="button"
                onClick={publishMoment}
                disabled={isPending || !hasMedia}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Publishing
                  </>
                ) : (
                  <>
                    Publish
                    <ChevronRight size={17} />
                  </>
                )}
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-2 font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function getVisibilityLabel(value: MomentVisibility) {
  const selected = visibilityOptions.find((option) => option.value === value);
  return selected?.label ?? "Followers";
}

function readMediaMetadata(
  previewUrl: string,
  mediaKind: MediaKind
): Promise<MediaMetadata> {
  return new Promise((resolve, reject) => {
    if (mediaKind === "image") {
      const image = new Image();

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