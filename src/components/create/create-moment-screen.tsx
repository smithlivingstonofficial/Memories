"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
import { LocationFields, type LocationSource } from "@/components/create/location-fields";
import { MoodSelector } from "@/components/create/mood-selector";
import {
  createLocationSuggestion,
  extractJpegGps,
  prepareImageForUpload,
} from "@/lib/media/client-media-processing";
import { MEMORY_MOODS } from "@/lib/moods";
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

type MomentVisibility = "public" | "followers" | "inner_circle" | "private";

type MediaMetadata = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  originalSize: number;
  optimizedSize: number;
  optimizationStatus: "not_needed" | "optimized" | "skipped" | "failed";
  latitude: number | null;
  longitude: number | null;
};

type UploadUrlResponse = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
  message?: string;
};

type DraftUploadedMedia = {
  objectKey: string;
  publicUrl: string | null;
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

export function CreateMomentScreen({
  user,
  initialDraft,
}: CreateMomentScreenProps) {
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(
    initialDraft?.media?.[0]?.publicUrl ?? ""
  );
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(
    initialDraft?.media?.[0]?.mediaKind === "video" ? "video" : initialDraft?.media?.[0] ? "image" : null
  );
  const [draftUploadedMedia, setDraftUploadedMedia] =
    useState<DraftUploadedMedia | null>(() => {
      const media = initialDraft?.media?.[0];
      return media?.objectKey
        ? {
            objectKey: media.objectKey,
            publicUrl: media.publicUrl ?? null,
          }
        : null;
    });
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata>({
    width: null,
    height: null,
    durationSeconds: null,
    originalSize: 0,
    optimizedSize: 0,
    optimizationStatus: "not_needed",
    latitude: null,
    longitude: null,
  });

  const [caption, setCaption] = useState(initialDraft?.caption ?? "");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(
    initialDraft?.moods?.length ? initialDraft.moods : ["Peaceful"]
  );
  const [visibility, setVisibility] =
    useState<MomentVisibility>(
      isMomentVisibility(initialDraft?.visibility)
        ? initialDraft.visibility
        : "followers"
    );
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [locationName, setLocationName] = useState(
    initialDraft?.locationName ?? ""
  );
  const [latitude, setLatitude] = useState<number | null>(
    initialDraft?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialDraft?.longitude ?? null
  );
  const [locationSource, setLocationSource] =
    useState<LocationSource>(
      isLocationSource(initialDraft?.locationSource)
        ? initialDraft.locationSource
        : "unknown"
    );
  const [locationConfidence, setLocationConfidence] = useState<number | null>(
    initialDraft?.locationConfidence ?? null
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(initialDraft?.locationAccuracyMeters ?? null);
  const [locationMessage, setLocationMessage] = useState("");
  const [message, setMessage] = useState("");

  const [isPending, startTransition] = useTransition();

  const hasMedia = Boolean((selectedFile || draftUploadedMedia) && previewUrl && mediaKind);
  const selectedVisibility = visibilityOptions.find(
    (option) => option.value === visibility
  );
  const autosave = useContentDraftAutosave({
    userId: user.id,
    initialDraftId: initialDraft?.id,
    draftType: "moment",
    payload: {
      caption,
      moods: selectedMoods,
      visibility,
      locationName,
      locationLabel: locationName,
      latitude,
      longitude,
      locationSource,
      locationConfidence,
      locationAccuracyMeters,
      media:
        draftUploadedMedia && mediaKind
          ? [
              {
                objectKey: draftUploadedMedia.objectKey,
                publicUrl: draftUploadedMedia.publicUrl,
                fileName: selectedFile?.name ?? initialDraft?.media?.[0]?.fileName ?? "Draft Moment",
                mimeType: selectedFile?.type ?? initialDraft?.media?.[0]?.mimeType ?? (mediaKind === "video" ? "video/mp4" : "image/jpeg"),
                mediaKind,
                sizeBytes: selectedFile?.size ?? initialDraft?.media?.[0]?.sizeBytes ?? 0,
                sortOrder: 0,
                uploadStatus: "uploaded",
              },
            ]
          : [],
    },
    hasMeaningfulContent: Boolean(
      user.id && (caption.trim() || draftUploadedMedia)
    ),
  });
  const autosaveLabel = formatAutosaveStatus(
    autosave.status,
    autosave.savedAt
  );

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

    if (isVideo && file.size > maxSize) {
      setMessage("Moment media should be less than 120 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const gps = await extractJpegGps(file);
    const prepared = isImage
      ? await prepareImageForUpload(file)
      : {
          file,
          originalSize: file.size,
          optimizedSize: file.size,
          status: "skipped" as const,
        };

    if (prepared.file.size > maxSize) {
      setMessage("Moment media should be less than 120 MB.");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(prepared.file);
    const nextMediaKind = isImage ? "image" : "video";

    setSelectedFile(prepared.file);
    setMediaKind(nextMediaKind);
    setPreviewUrl(nextPreviewUrl);
    setMediaMetadata({
      width: null,
      height: null,
      durationSeconds: null,
      originalSize: prepared.originalSize,
      optimizedSize: prepared.optimizedSize,
      optimizationStatus: prepared.status,
      latitude: gps?.latitude ?? null,
      longitude: gps?.longitude ?? null,
    });
    setDraftUploadedMedia(null);

    if (gps && !latitude && !longitude) {
      const suggestion = createLocationSuggestion([gps]);
      if (suggestion) {
        setLatitude(suggestion.latitude);
        setLongitude(suggestion.longitude);
        setLocationName(suggestion.label);
        setLocationSource(suggestion.source);
        setLocationConfidence(suggestion.confidence);
        setLocationAccuracyMeters(null);
        setLocationMessage("Location suggested from uploaded media metadata.");
      }
    }

    try {
      setMessage("Uploading draft media...");

      const uploadUrlResponse = await fetch("/api/moments/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: prepared.file.name,
          contentType: prepared.file.type,
          sizeBytes: prepared.file.size,
          mediaKind: nextMediaKind,
        }),
      });

      const uploadUrlResult =
        (await uploadUrlResponse.json()) as UploadUrlResponse;

      if (!uploadUrlResponse.ok) {
        throw new Error(uploadUrlResult.message || "Unable to upload draft.");
      }

      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": prepared.file.type,
        },
        body: prepared.file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Draft media upload failed.");
      }

      setDraftUploadedMedia({
        objectKey: uploadUrlResult.objectKey,
        publicUrl: uploadUrlResult.publicUrl,
      });
      setMessage("Draft media saved.");

      const metadata = await readMediaMetadata(nextPreviewUrl, nextMediaKind);
      setMediaMetadata((current) => ({
        ...current,
        ...metadata,
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save draft media."
      );
      setMediaMetadata((current) => ({
        ...current,
        width: null,
        height: null,
        durationSeconds: null,
      }));
    }
  }

  function resetMedia() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setMediaKind(null);
    setPreviewUrl("");
    setDraftUploadedMedia(null);
    setMediaMetadata({
      width: null,
      height: null,
      durationSeconds: null,
      originalSize: 0,
      optimizedSize: 0,
      optimizationStatus: "not_needed",
      latitude: null,
      longitude: null,
    });
    setMessage("");
  }

  async function publishMoment() {
    setMessage("");

    if ((!selectedFile && !draftUploadedMedia) || !mediaKind) {
      setMessage("Add a photo or video before publishing a Moment.");
      return;
    }

    startTransition(async () => {
      try {
        setMessage("Saving Moment...");

        let uploadedMedia = draftUploadedMedia;

        if (!uploadedMedia && selectedFile) {
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

          uploadedMedia = {
            objectKey: uploadUrlResult.objectKey,
            publicUrl: uploadUrlResult.publicUrl,
          };
        }

        if (!uploadedMedia) {
          throw new Error("Moment media is not ready yet.");
        }

        setMessage("Saving Moment...");

        const formData = new FormData();
        formData.append("draftId", autosave.draftId ?? initialDraft?.id ?? "");
        formData.append("objectKey", uploadedMedia.objectKey);
        formData.append("publicUrl", uploadedMedia.publicUrl ?? "");
        formData.append("mediaKind", mediaKind);
        formData.append("mimeType", selectedFile?.type ?? initialDraft?.media?.[0]?.mimeType ?? "");
        formData.append("sizeBytes", String(selectedFile?.size ?? initialDraft?.media?.[0]?.sizeBytes ?? 0));
        formData.append("width", String(mediaMetadata.width ?? ""));
        formData.append("height", String(mediaMetadata.height ?? ""));
        formData.append(
          "durationSeconds",
          String(mediaMetadata.durationSeconds ?? "")
        );
        formData.append("mediaLatitude", String(mediaMetadata.latitude ?? ""));
        formData.append("mediaLongitude", String(mediaMetadata.longitude ?? ""));
        formData.append(
          "originalSizeBytes",
          String(
            mediaMetadata.originalSize ||
              selectedFile?.size ||
              initialDraft?.media?.[0]?.sizeBytes ||
              0
          )
        );
        formData.append(
          "optimizedSizeBytes",
          String(
            mediaMetadata.optimizedSize ||
              selectedFile?.size ||
              initialDraft?.media?.[0]?.sizeBytes ||
              0
          )
        );
        formData.append("optimizationStatus", mediaMetadata.optimizationStatus);
        formData.append(
          "usedForLocationSuggestion",
          String(
            mediaMetadata.latitude !== null && mediaMetadata.longitude !== null
          )
        );
        formData.append("caption", caption.trim());
        formData.append("mood", selectedMoods[0] ?? "");
        formData.append("visibility", visibility);
        formData.append("locationName", locationName);
        formData.append("locationLabel", locationName);
        formData.append("latitude", String(latitude ?? ""));
        formData.append("longitude", String(longitude ?? ""));
        formData.append("locationSource", locationSource);
        formData.append("locationConfidence", String(locationConfidence ?? ""));
        formData.append(
          "locationAccuracyMeters",
          String(locationAccuracyMeters ?? "")
        );

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
    <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-[1500px] space-y-3 pb-[13rem] sm:mx-auto sm:w-full sm:space-y-4 sm:pb-0">
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

      <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/create"
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:mb-1"
            >
              <ArrowLeft size={16} />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Create</span>
            </Link>

            <p className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
              <Sparkles size={14} />
              Moment Creator
            </p>

            <h1 className="mt-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:mt-2 sm:text-4xl lg:text-3xl">
              Create Moment
            </h1>

            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-[var(--app-muted)] sm:block lg:hidden">
              Publish a quick photo or video that stays active for 24 hours.
            </p>
          </div>

          <div className="hidden flex-col gap-3 sm:flex lg:items-end">
            <div className="flex flex-wrap gap-2">
              <ComposerChip label="Visible" value={selectedVisibility?.label ?? "Followers"} />
              <ComposerChip label="Media" value={hasMedia ? "1" : "0"} />
              <ComposerChip label="Life" value="24h" />
              {autosaveLabel && (
                <ComposerChip label="Draft" value={autosaveLabel} />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetMedia}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={publishMoment}
                disabled={isPending || !hasMedia}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Publishing..." : "Publish"}
                {!isPending && <ChevronRight size={17} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <div className="mem-card overflow-hidden rounded-[1.2rem] sm:rounded-[2rem]">
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
                        {selectedMoods[0] ?? "Peaceful"}
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

        <aside className="space-y-3 sm:space-y-4">
          <SidePanelSection
            icon={<Camera size={17} />}
            title="Moment details"
            description="Keep it short and meaningful."
            defaultOpen
          >
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
              <MoodSelector
                moods={MEMORY_MOODS}
                selectedMoods={selectedMoods}
                onChange={setSelectedMoods}
                maxSelections={1}
              />
            </div>

            <div className="mt-5">
              <LocationFields
                locationName={locationName}
                latitude={latitude}
                longitude={longitude}
                locationSource={locationSource}
                locationConfidence={locationConfidence}
                locationAccuracyMeters={locationAccuracyMeters}
                locationMessage={locationMessage}
                onLocationNameChange={(value) => {
                  setLocationName(value);
                  if (!latitude || !longitude) {
                    setLocationSource(value.trim() ? "manual" : "unknown");
                  }
                }}
                onLocationChange={(location) => {
                  setLocationName(location.locationName);
                  setLatitude(location.latitude);
                  setLongitude(location.longitude);
                  setLocationSource(location.locationSource);
                  setLocationConfidence(location.locationConfidence);
                  setLocationAccuracyMeters(location.locationAccuracyMeters);
                  setLocationMessage(location.locationMessage);
                }}
              />
            </div>
          </SidePanelSection>

          <SidePanelSection
            icon={<ShieldCheck size={17} />}
            title="Visibility"
            description={selectedVisibility?.description ?? "Choose who can view this Moment."}
            defaultOpen
          >
            <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {selectedVisibility?.label ?? "Followers"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    {selectedVisibility?.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibilityDialogOpen(true)}
                  disabled={isPending}
                  className="shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-accent)] transition hover:border-[var(--app-accent)] disabled:opacity-60"
                >
                  Change
                </button>
              </div>
            </div>
          </SidePanelSection>

          <section className="mem-card-strong rounded-[1.35rem] p-3 sm:rounded-[1.7rem] sm:p-4">
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

      <div className="fixed inset-x-2 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
        <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
          {selectedVisibility?.label ?? "Followers"} - {hasMedia ? "1 media" : "No media"}
          {autosaveLabel ? ` - ${autosaveLabel}` : ""}
        </p>
        <button
          type="button"
          onClick={publishMoment}
          disabled={isPending || !hasMedia}
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

function ComposerChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs text-[var(--app-muted)]">
      <span className="font-semibold uppercase tracking-[0.14em]">
        {label}
      </span>
      <strong className="font-brand text-sm font-semibold text-[var(--app-text)]">
        {value}
      </strong>
    </span>
  );
}

function SidePanelSection({
  icon,
  title,
  description,
  action,
  defaultOpen = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(defaultOpen);

  return (
    <section className="mem-card-strong rounded-[1.35rem] p-3 sm:rounded-[1.7rem] sm:p-4">
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 text-left md:pointer-events-none"
        aria-expanded={mobileOpen}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)] sm:size-10">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block font-brand text-base font-semibold text-[var(--app-text)] sm:text-lg">
              {title}
            </span>
            <span className="mt-1 hidden text-xs leading-5 text-[var(--app-muted)] sm:block">
              {description}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {action && (
            <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              {action}
            </span>
          )}
          <ChevronRight
            size={18}
            className={cn(
              "text-[var(--app-muted)] transition md:hidden",
              mobileOpen && "rotate-90"
            )}
          />
        </span>
      </button>
      <div className={cn("mt-4", mobileOpen ? "block" : "hidden md:block")}>
        {children}
      </div>
    </section>
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

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
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
            X
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
                {selected && (
                  <Check size={17} className="ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getVisibilityLabel(value: MomentVisibility) {
  const selected = visibilityOptions.find((option) => option.value === value);
  return selected?.label ?? "Followers";
}

function isMomentVisibility(value?: string | null): value is MomentVisibility {
  return (
    value === "public" ||
    value === "followers" ||
    value === "inner_circle" ||
    value === "private"
  );
}

function isLocationSource(value?: string | null): value is LocationSource {
  return (
    value === "manual" ||
    value === "browser_gps" ||
    value === "media_gps" ||
    value === "mixed_media" ||
    value === "unknown"
  );
}

function readMediaMetadata(
  previewUrl: string,
  mediaKind: MediaKind
): Promise<Pick<MediaMetadata, "width" | "height" | "durationSeconds">> {
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
