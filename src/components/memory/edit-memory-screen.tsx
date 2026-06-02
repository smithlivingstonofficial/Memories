"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Tags,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  editMemoryAction,
  type EditMemoryState,
} from "@/app/actions/memories";
import { MoodSelector } from "@/components/create/mood-selector";
import { Button } from "@/components/ui/button";
import { uploadMedia } from "@/lib/media/upload-media";
import {
  createLocationSuggestion,
  extractJpegGps,
  prepareImageForUpload,
  type MediaGpsLocation,
} from "@/lib/media/client-media-processing";
import {
  LocationFields,
  type LocationSource,
} from "@/components/create/location-fields";
import { MEMORY_MOODS, VAULT_MOODS } from "@/lib/moods";
import { MEMORY_PRIVACY_OPTIONS } from "@/lib/memories/privacy";
import type {
  EditableMemory,
  EditableMemoryMedia,
} from "@/lib/memories/get-editable-memory";
import { VaultAccessPanel } from "@/components/vault/vault-access-screen";
import { cn } from "@/lib/utils";

const initialState: EditMemoryState = {
  message: "",
  errors: {},
};

type UploadedAsset = {
  assetId: string;
  fileName: string;
  mimeType: string;
  previewUrl: string;
  latitude: number | null;
  longitude: number | null;
  originalSize: number;
  optimizedSize: number;
  optimizationStatus: "not_needed" | "optimized" | "skipped" | "failed";
};

type EditMemoryScreenProps = {
  memory: EditableMemory;
  mode: "memory" | "vault";
  vaultAccess?: {
    hasPasscode: boolean;
    isUnlocked: boolean;
  };
};

export function EditMemoryScreen({
  memory,
  mode,
  vaultAccess,
}: EditMemoryScreenProps) {
  const isVault = mode === "vault";
  const [state, formAction, pending] = useActionState(
    editMemoryAction,
    initialState
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entryDate, setEntryDate] = useState(memory.entryDate);
  const [title, setTitle] = useState(memory.title);
  const [content, setContent] = useState(memory.content);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(
    memory.moods.length > 0
      ? memory.moods
      : [isVault ? "Thoughtful" : "Peaceful"]
  );
  const [privacy, setPrivacy] =
    useState<(typeof MEMORY_PRIVACY_OPTIONS)[number]["value"]>(memory.privacy);
  const [locationName, setLocationName] = useState(memory.locationName);
  const [latitude, setLatitude] = useState<number | null>(memory.latitude);
  const [longitude, setLongitude] = useState<number | null>(memory.longitude);
  const [locationSource, setLocationSource] =
    useState<LocationSource>(memory.locationSource);
  const [locationConfidence, setLocationConfidence] = useState<number | null>(
    memory.locationConfidence
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(memory.locationAccuracyMeters);
  const [locationMessage, setLocationMessage] = useState("");
  const [tags, setTags] = useState(memory.tags.join(", "));
  const [existingMedia, setExistingMedia] = useState(memory.media);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const wordCount = useMemo(() => {
    return content.trim().length === 0
      ? 0
      : content.trim().split(/\s+/).length;
  }, [content]);

  const mediaCount = existingMedia.length + uploadedAssets.length;
  const backHref = isVault ? "/vault" : `/memory/${memory.id}`;
  const moodOptions = isVault ? VAULT_MOODS : MEMORY_MOODS;
  const vaultNeedsUnlock = privacy === "vault" && !vaultAccess?.isUnlocked;

  async function handleFileChange(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploadMessage("");
    setUploading(true);

    try {
      const remainingSlots = Math.max(0, 10 - mediaCount);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const uploaded: UploadedAsset[] = [];
      const gpsLocations: MediaGpsLocation[] = [];

      for (const file of selectedFiles) {
        const gps = await extractJpegGps(file);
        if (gps) gpsLocations.push(gps);

        const prepared = file.type.startsWith("image/")
          ? await prepareImageForUpload(file)
          : {
              file,
              originalSize: file.size,
              optimizedSize: file.size,
              status: "skipped" as const,
            };

        const result = await uploadMedia({
          file: prepared.file,
          purpose: privacy === "vault" ? "vault" : "memory",
          visibility: privacy === "vault"
            ? "private"
            : privacy === "public"
              ? "public"
              : privacy === "inner_circle"
                ? "inner_circle"
                : "private",
          originalFileSize: prepared.originalSize,
          optimizedFileSize: prepared.optimizedSize,
          latitude: gps?.latitude ?? null,
          longitude: gps?.longitude ?? null,
          optimizationStatus: prepared.status,
          usedForLocationSuggestion: Boolean(gps),
        });

        uploaded.push({
          assetId: result.assetId,
          fileName: prepared.file.name,
          mimeType: prepared.file.type,
          previewUrl: URL.createObjectURL(prepared.file),
          latitude: gps?.latitude ?? null,
          longitude: gps?.longitude ?? null,
          originalSize: prepared.originalSize,
          optimizedSize: prepared.optimizedSize,
          optimizationStatus: prepared.status,
        });
      }

      setUploadedAssets((current) => [...current, ...uploaded]);
      setUploadMessage(
        isVault ? "Private media uploaded." : "Media uploaded successfully."
      );

      const suggestion = createLocationSuggestion(gpsLocations);
      if (suggestion && !latitude && !longitude) {
        setLatitude(suggestion.latitude);
        setLongitude(suggestion.longitude);
        setLocationName(suggestion.label);
        setLocationSource(suggestion.source);
        setLocationConfidence(suggestion.confidence);
        setLocationAccuracyMeters(null);
        setLocationMessage("Location suggested from uploaded media metadata.");
      }
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Media upload failed."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeExistingAsset(assetId: string) {
    setExistingMedia((current) =>
      current.filter((asset) => asset.assetId !== assetId)
    );
  }

  function removeUploadedAsset(assetId: string) {
    setUploadedAssets((current) =>
      current.filter((asset) => asset.assetId !== assetId)
    );
  }

  function handleLocationNameChange(value: string) {
    setLocationName(value);

    if (!latitude || !longitude) {
      setLocationSource(value.trim() ? "manual" : "unknown");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="mem-card mb-5 rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
            >
              <ArrowLeft size={16} />
              {isVault ? "Back to Vault" : "Back to Memory"}
            </Link>

            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <LockKeyhole size={14} />
              {isVault ? "Edit Vault Entry" : "Edit Memory"}
            </p>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              {isVault ? "Update your private entry." : "Update this memory."}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <InfoPill
              label={isVault ? "Privacy" : "Date"}
              value={isVault ? "Only you" : formatDateLabel(entryDate)}
            />
            <InfoPill label="Words" value={wordCount.toString()} />
            <InfoPill label="Media" value={mediaCount.toString()} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="memoryId" value={memory.id} />
            <input
              type="hidden"
              name="moods"
              value={JSON.stringify(selectedMoods)}
            />
            <input
              type="hidden"
              name="entryTimezone"
              value={memory.entryTimezone || "Asia/Kolkata"}
            />
            <input
              type="hidden"
              name="existingMediaAssetIds"
              value={JSON.stringify(existingMedia.map((asset) => asset.assetId))}
            />
            <input
              type="hidden"
              name="mediaAssetIds"
              value={JSON.stringify(
                uploadedAssets.map((asset) => asset.assetId)
              )}
            />

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--app-text)]">
                <CalendarDays size={16} />
                Entry date
              </label>
              <input
                type="date"
                name="entryDate"
                value={entryDate}
                required
                onChange={(event) => setEntryDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
              />
              <FieldError message={state.errors?.entryDate?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                {isVault ? "Vault title" : "Memory title"}
              </label>
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isVault
                    ? "A thought I want to keep..."
                    : "Give this memory a gentle title..."
                }
                className="h-14 w-full border-none bg-transparent font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-3xl"
              />
              <FieldError message={state.errors?.title?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                {isVault ? "Private diary" : "Your memory"}
              </label>
              <textarea
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  isVault
                    ? "Write freely. This space is private..."
                    : "Start writing what happened, how it felt, and why you want to remember it..."
                }
                rows={12}
                className="min-h-[320px] w-full resize-none border-none bg-transparent text-[16px] leading-8 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)]"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                <p className="text-xs text-[var(--app-muted)]">
                  {isVault
                    ? "No likes. No reflections. No public sharing."
                    : "Changes will update calendar, timeline, and profile views."}
                </p>
                <p className="text-xs font-medium text-[var(--app-muted)]">
                  {wordCount} words
                </p>
              </div>
              <FieldError message={state.errors?.content?.[0]} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="mem-card-strong rounded-[1.7rem] p-4">
                <MoodSelector
                  moods={moodOptions}
                  selectedMoods={selectedMoods}
                  onChange={setSelectedMoods}
                />
                <FieldError message={state.errors?.moods?.[0]} />
              </div>

              <div className="mem-card-strong rounded-[1.7rem] p-4">
                <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                  Privacy
                </label>
                <input type="hidden" name="privacy" value={privacy} />
                <div className="space-y-2">
                  {MEMORY_PRIVACY_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPrivacy(item.value)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[1.1rem] border p-3 text-left transition-all",
                        privacy === item.value
                          ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                          : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                      )}
                    >
                      <LockKeyhole size={17} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 opacity-75">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                {vaultNeedsUnlock && (
                  <div className="mt-4">
                    <VaultAccessPanel
                      hasPasscode={Boolean(vaultAccess?.hasPasscode)}
                    />
                  </div>
                )}

                <FieldError message={state.errors?.privacy?.[0]} />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <LocationFields
                locationName={locationName}
                latitude={latitude}
                longitude={longitude}
                locationSource={locationSource}
                locationConfidence={locationConfidence}
                locationAccuracyMeters={locationAccuracyMeters}
                locationMessage={locationMessage}
                onLocationNameChange={handleLocationNameChange}
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

              <TextField
                icon={<Tags size={16} />}
                label="Tags"
                name="tags"
                value={tags}
                placeholder="sunset, peace, family"
                onChange={setTags}
              />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--app-text)]">
                    {isVault ? "Private media" : "Photos or videos"}
                  </label>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    Remove existing attachments or add new ones.
                  </p>
                </div>
                <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  {mediaCount}/10
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || mediaCount >= 10}
                className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] p-6 text-center transition hover:border-[var(--app-accent)] disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="mb-3 animate-spin text-[var(--app-accent)]" />
                ) : (
                  <UploadCloud className="mb-3 text-[var(--app-accent)]" />
                )}
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {uploading ? "Uploading media..." : "Upload more media"}
                </p>
              </button>

              {uploadMessage && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {uploadMessage}
                </p>
              )}

              <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
                Large images are optimized before upload. Videos keep their original file and must stay under the upload limit.
              </p>

              {(existingMedia.length > 0 || uploadedAssets.length > 0) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {existingMedia.map((asset) => (
                    <MediaPreview
                      key={asset.assetId}
                      asset={asset}
                      onRemove={() => removeExistingAsset(asset.assetId)}
                    />
                  ))}
                  {uploadedAssets.map((asset) => (
                    <MediaPreview
                      key={asset.assetId}
                      asset={asset}
                      onRemove={() => removeUploadedAsset(asset.assetId)}
                    />
                  ))}
                </div>
              )}

              <FieldError message={state.errors?.mediaAssetIds?.[0]} />
            </div>

            {state.message && (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-500">
                {state.message}
              </div>
            )}

            <div className="sticky bottom-4 z-20 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 shadow-[0_24px_70px_var(--app-shadow)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={backHref}
                  className="flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:flex-1"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  disabled={pending || uploading || vaultNeedsUnlock}
                  className="h-12 rounded-2xl bg-[var(--app-accent)] text-[15px] font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)] sm:flex-[1.4]"
                >
                  {pending ? "Updating memory..." : "Update Memory"}
                  {!pending && <ArrowRight size={17} />}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="sticky top-4 space-y-5">
            <div className="mem-card rounded-[2rem] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Preview
                </h2>
                <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  {
                    MEMORY_PRIVACY_OPTIONS.find(
                      (item) => item.value === privacy
                    )?.label
                  }
                </span>
              </div>
              <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
                <PreviewMedia
                  existingMedia={existingMedia}
                  uploadedAssets={uploadedAssets}
                />
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedMoods.map((mood) => (
                    <span
                      key={mood}
                      className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
                    >
                      {mood}
                    </span>
                  ))}
                </div>
                <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  {title || (isVault ? "Untitled Vault entry" : "Untitled memory")}
                </h3>
                <p className="mt-2 line-clamp-6 text-sm leading-6 text-[var(--app-muted)]">
                  {content || "Your updated writing preview will appear here..."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TextField({
  icon,
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mem-card-strong rounded-[1.7rem] p-4">
      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--app-text)]">
        {icon}
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
      />
    </div>
  );
}

function MediaPreview({
  asset,
  onRemove,
}: {
  asset: EditableMemoryMedia | UploadedAsset;
  onRemove: () => void;
}) {
  const url = getMediaUrl(asset);
  const isImage = asset.mimeType.startsWith("image/");

  return (
    <div className="group relative overflow-hidden rounded-[1.3rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]">
      {isImage ? (
        <img
          src={url}
          alt={asset.fileName}
          className="h-36 w-full object-cover"
        />
      ) : (
        <video src={url} className="h-36 w-full object-cover" muted controls />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-xl bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-rose-600"
        aria-label="Remove media"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PreviewMedia({
  existingMedia,
  uploadedAssets,
}: {
  existingMedia: EditableMemoryMedia[];
  uploadedAssets: UploadedAsset[];
}) {
  const asset = uploadedAssets[0] ?? existingMedia[0];

  if (!asset) {
    return (
      <div className="mb-4 flex h-60 items-center justify-center rounded-[1.3rem] [background:var(--vault-hero)]">
        <ImagePlus className="text-[var(--app-accent)]" />
      </div>
    );
  }

  const url = getMediaUrl(asset);

  if (asset.mimeType.startsWith("image/")) {
    return (
      <img
        src={url}
        alt="Preview"
        className="mb-4 h-60 w-full rounded-[1.3rem] object-cover"
      />
    );
  }

  return (
    <video
      src={url}
      className="mb-4 h-60 w-full rounded-[1.3rem] object-cover"
      muted
      controls
    />
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function getMediaUrl(asset: EditableMemoryMedia | UploadedAsset) {
  return "previewUrl" in asset ? asset.previewUrl : asset.url;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-500">{message}</p>;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Today";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
