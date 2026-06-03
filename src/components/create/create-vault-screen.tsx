"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  ImagePlus,
  LockKeyhole,
  Tags,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createVaultEntryAction,
  type CreateVaultEntryState,
} from "@/app/actions/memories";
import { deleteUploadedMedia } from "@/lib/media/delete-uploaded-media";
import { uploadMedia } from "@/lib/media/upload-media";
import {
  createLocationSuggestion,
  extractJpegGps,
  prepareImageForUpload,
  type MediaGpsLocation,
} from "@/lib/media/client-media-processing";
import { Button } from "@/components/ui/button";
import {
  LocationFields,
  type LocationSource,
} from "@/components/create/location-fields";
import { MoodSelector } from "@/components/create/mood-selector";
import { VAULT_MOODS } from "@/lib/moods";
import { cn } from "@/lib/utils";
import {
  formatAutosaveStatus,
  useContentDraftAutosave,
} from "@/hooks/use-content-draft-autosave";
import type { ContentDraft } from "@/types/draft";

const initialState: CreateVaultEntryState = {
  message: "",
  errors: {},
};

type UploadedAsset = {
  assetId: string;
  objectKey: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  previewUrl: string;
  latitude: number | null;
  longitude: number | null;
  originalSize: number;
  optimizedSize: number;
  optimizationStatus: "not_needed" | "optimized" | "skipped" | "failed";
};

type CreateVaultScreenProps = {
  initialDraft?: ContentDraft | null;
  user?: {
    id?: string;
    username: string;
  };
};

export function CreateVaultScreen({ initialDraft, user }: CreateVaultScreenProps) {
  const [state, formAction, pending] = useActionState(
    createVaultEntryAction,
    initialState
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [content, setContent] = useState(initialDraft?.content ?? "");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(
    initialDraft?.moods?.length ? initialDraft.moods : ["Thoughtful"]
  );
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
  const [tags, setTags] = useState((initialDraft?.tags ?? []).join(", "));
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>(() =>
    mapDraftMediaToUploadedAssets(initialDraft)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const wordCount = useMemo(() => {
    return content.trim().length === 0
      ? 0
      : content.trim().split(/\s+/).length;
  }, [content]);
  const draftPayload = useMemo(
    () => ({
      title,
      content,
      moods: selectedMoods,
      privacy: "vault",
      entryTimezone: "Asia/Kolkata",
      locationName,
      locationLabel: locationName,
      latitude,
      longitude,
      locationSource,
      locationConfidence,
      locationAccuracyMeters,
      tags: parseTags(tags),
      media: uploadedAssets.map((asset, index) => ({
        mediaAssetId: asset.assetId,
        objectKey: asset.objectKey,
        publicUrl: asset.publicUrl,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        mediaKind: asset.mimeType.startsWith("video/") ? "video" as const : "image" as const,
        sizeBytes: asset.optimizedSize || asset.originalSize,
        sortOrder: index,
        uploadStatus: "uploaded" as const,
      })),
    }),
    [
      content,
      latitude,
      locationAccuracyMeters,
      locationConfidence,
      locationName,
      locationSource,
      longitude,
      selectedMoods,
      tags,
      title,
      uploadedAssets,
    ]
  );
  const hasMeaningfulDraft =
    Boolean(title.trim() || content.trim() || uploadedAssets.length > 0) &&
    Boolean(user?.id);
  const autosave = useContentDraftAutosave({
    userId: user?.id,
    initialDraftId: initialDraft?.id,
    draftType: "vault",
    payload: draftPayload,
    hasMeaningfulContent: hasMeaningfulDraft,
  });
  const autosaveLabel = formatAutosaveStatus(
    autosave.status,
    autosave.savedAt
  );

  async function handleFileChange(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploadMessage("");
    setUploading(true);

    try {
      const remainingSlots = Math.max(0, 10 - uploadedAssets.length);
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
          purpose: "vault",
          visibility: "private",
          originalFileSize: prepared.originalSize,
          optimizedFileSize: prepared.optimizedSize,
          latitude: gps?.latitude ?? null,
          longitude: gps?.longitude ?? null,
          optimizationStatus: prepared.status,
          usedForLocationSuggestion: Boolean(gps),
        });

        uploaded.push({
          assetId: result.assetId,
          objectKey: result.objectKey,
          publicUrl: result.publicUrl,
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
      setUploadMessage("Private media uploaded successfully.");

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
        error instanceof Error ? error.message : "Vault media upload failed."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeAsset(assetId: string) {
    setUploadedAssets((current) =>
      current.filter((asset) => asset.assetId !== assetId)
    );
    void deleteUploadedMedia(assetId);
  }

  function handleLocationNameChange(value: string) {
    setLocationName(value);

    if (!latitude || !longitude) {
      setLocationSource(value.trim() ? "manual" : "unknown");
    }
  }

  return (
    <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-[1500px] sm:mx-auto sm:w-full lg:h-[calc(100dvh-3rem)] lg:min-h-0">
      <form
        id="create-vault-entry-form"
        action={formAction}
        className="space-y-3 pb-[13rem] sm:space-y-4 sm:pb-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-4 lg:overflow-hidden"
      >
        <input
          type="hidden"
          name="draftId"
          value={autosave.draftId ?? initialDraft?.id ?? ""}
        />

        <input
          type="hidden"
          name="moods"
          value={JSON.stringify(selectedMoods)}
        />

        <input
          type="hidden"
          name="mediaAssetIds"
          value={JSON.stringify(uploadedAssets.map((asset) => asset.assetId))}
        />

      <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4 lg:shrink-0">
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
              <LockKeyhole size={14} />
              Vault Writer
            </p>

            <h1 className="mt-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:mt-2 sm:text-4xl lg:text-3xl">
              Create Vault Entry
            </h1>

            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-[var(--app-muted)] sm:block lg:hidden">
              Write thoughts that are only for you. Vault entries are private by
              default and never appear in Home or Discover.
            </p>
          </div>

          <div className="hidden flex-col gap-3 sm:flex lg:items-end">
            <div className="flex flex-wrap gap-2">
              <ComposerChip label="Privacy" value="Vault" />
              <ComposerChip label="Words" value={wordCount.toString()} />
              <ComposerChip label="Media" value={`${uploadedAssets.length}/10`} />
              {autosaveLabel && (
                <ComposerChip label="Draft" value={autosaveLabel} />
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href="/create"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Cancel
              </Link>

              <Button
                type="submit"
                disabled={pending || uploading}
                className="h-11 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
              >
                {pending ? "Saving..." : "Save to Vault"}
                {!pending && <ArrowRight size={17} />}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <section className="min-w-0 lg:min-h-0">
          <div className="mem-card flex h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem] sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:gap-3 sm:p-4 lg:shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)] sm:text-xs sm:tracking-[0.16em]">
                  Vault privacy
                </p>
                <p className="mt-1 hidden text-sm text-[var(--app-muted)] sm:block">
                  Only you can see this entry.
                </p>
              </div>
              <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                Private
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3.5 sm:p-6 lg:overflow-hidden">
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A thought I want to keep..."
                className="w-full border-none bg-transparent font-brand text-xl font-semibold leading-tight text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-4xl"
              />

              <FieldError message={state.errors?.title?.[0]} />

              <div className="my-3.5 h-px bg-[var(--app-border)] sm:my-5" />

              <textarea
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write freely. This space is private..."
                rows={13}
                className="min-h-[52dvh] w-full flex-1 resize-none border-none bg-transparent text-[15.5px] leading-7 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:min-h-[460px] sm:text-[17px] sm:leading-8 lg:min-h-0"
              />
              <FieldError message={state.errors?.content?.[0]} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-muted)] sm:justify-between sm:px-6 lg:shrink-0">
              <span className="hidden sm:inline">
                No likes. No reflections. No public sharing.
              </span>
              <span className="font-semibold">{wordCount} words</span>
            </div>
          </div>
        </section>

        <aside className="min-w-0 lg:min-h-0">
          <div className="space-y-3 sm:space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <div className="hidden items-center justify-between rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 lg:flex">
              <div>
                <h2 className="font-brand text-lg font-semibold text-[var(--app-text)]">
                  Vault details
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Add only what helps this entry.
                </p>
              </div>
              <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                {uploadedAssets.length}/10 media
              </span>
            </div>

            <SidePanelSection
              icon={<LockKeyhole size={17} />}
              title="Mood"
              description="Choose the private feeling for this entry."
              defaultOpen
            >
              <MoodSelector
                moods={VAULT_MOODS}
                selectedMoods={selectedMoods}
                onChange={setSelectedMoods}
              />

              <FieldError message={state.errors?.moods?.[0]} />
            </SidePanelSection>

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

            <SidePanelSection
              icon={<Tags size={17} />}
              title="Tags"
              description="Use commas to keep this private entry searchable."
            >

                <input
                  name="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="private, healing, dream"
                  className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
                />
            </SidePanelSection>

            <SidePanelSection
              icon={<UploadCloud size={17} />}
              title="Private media"
              description="Optional photos or videos connected to this Vault entry."
              action={`${uploadedAssets.length}/10`}
            >

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
                disabled={uploading || uploadedAssets.length >= 10}
                className="flex min-h-[84px] w-full flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-center transition hover:border-[var(--app-accent)] disabled:opacity-60 sm:min-h-[112px] sm:rounded-[1.5rem] sm:p-5 lg:min-h-[88px] lg:p-3"
              >
                {uploading ? (
                  <Loader2 className="mb-3 animate-spin text-[var(--app-accent)]" />
                ) : (
                  <UploadCloud className="mb-3 text-[var(--app-accent)]" />
                )}

                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {uploading ? "Uploading privately..." : "Upload private media"}
                </p>

                <p className="mt-1 hidden max-w-sm text-xs leading-5 text-[var(--app-muted)] sm:block">
                  Media is stored privately in Cloudflare R2.
                </p>
              </button>

              {uploadMessage && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {uploadMessage}
                </p>
              )}

              <p className="mt-3 hidden text-xs leading-5 text-[var(--app-muted)] sm:block">
                Large images are optimized before upload. Videos keep their original file and must stay under the upload limit.
              </p>

              {uploadedAssets.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {uploadedAssets.map((asset) => (
                    <div
                      key={asset.assetId}
                      className="group relative h-24 w-28 shrink-0 overflow-hidden rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]"
                    >
                      {!asset.previewUrl ? (
                        <div className="flex h-full w-full items-center justify-center text-[var(--app-accent)]">
                          <ImagePlus size={18} />
                        </div>
                      ) : asset.mimeType.startsWith("image/") ? (
                        <img
                          src={asset.previewUrl}
                          alt={asset.fileName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={asset.previewUrl}
                          className="h-full w-full object-cover"
                          muted
                          controls
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeAsset(asset.assetId)}
                        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-xl bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SidePanelSection>

            {state.message && (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-500">
                {state.message}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-2 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
        <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
          Vault - {uploadedAssets.length}/10 media
        </p>
        <Button
          type="submit"
          disabled={pending || uploading}
          className="h-12 w-full rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
        >
          {pending ? "Saving..." : "Save to Vault"}
          {!pending && <ArrowRight size={17} />}
        </Button>
      </div>
      </form>
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
          <ChevronDown
            size={18}
            className={cn(
              "text-[var(--app-muted)] transition md:hidden",
              mobileOpen && "rotate-180"
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-500">{message}</p>;
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

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function mapDraftMediaToUploadedAssets(draft?: ContentDraft | null) {
  if (!draft?.media?.length) return [];

  return draft.media
    .filter((media) => media.uploadStatus !== "deleted")
    .map((media): UploadedAsset => {
      const metadata = media.metadata ?? {};

      return {
        assetId: media.mediaAssetId ?? media.id ?? crypto.randomUUID(),
        objectKey: media.objectKey ?? "",
        publicUrl: media.publicUrl ?? null,
        fileName: media.fileName ?? "Draft media",
        mimeType:
          media.mimeType ??
          (media.mediaKind === "video" ? "video/mp4" : "image/jpeg"),
        previewUrl:
          typeof metadata.previewUrl === "string"
            ? metadata.previewUrl
            : media.publicUrl ?? "",
        latitude: null,
        longitude: null,
        originalSize: media.sizeBytes ?? 0,
        optimizedSize: media.sizeBytes ?? 0,
        optimizationStatus: "not_needed",
      };
    });
}
