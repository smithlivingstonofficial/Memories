"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Sparkles,
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
import { deleteUploadedMedia } from "@/lib/media/delete-uploaded-media";
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
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  const wordCount = useMemo(() => {
    return content.trim().length === 0
      ? 0
      : content.trim().split(/\s+/).length;
  }, [content]);

  const mediaCount = existingMedia.length + uploadedAssets.length;
  const backHref = isVault ? "/vault" : `/memory/${memory.id}`;
  const moodOptions = isVault ? VAULT_MOODS : MEMORY_MOODS;
  const selectedPrivacy = MEMORY_PRIVACY_OPTIONS.find(
    (item) => item.value === privacy
  );
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
        action={formAction}
        className="space-y-3 pb-[13rem] sm:space-y-4 sm:pb-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-4 lg:overflow-hidden"
      >
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
          value={JSON.stringify(uploadedAssets.map((asset) => asset.assetId))}
        />

      <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4 lg:shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:mb-1"
            >
              <ArrowLeft size={16} />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">
                {isVault ? "Back to Vault" : "Back to Memory"}
              </span>
            </Link>

            <p className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
              <LockKeyhole size={14} />
              {isVault ? "Edit Vault Entry" : "Edit Memory"}
            </p>

            <h1 className="mt-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:mt-2 sm:text-4xl lg:text-3xl">
              {isVault ? "Edit Vault Entry" : "Edit Memory"}
            </h1>
          </div>

          <div className="hidden flex-col gap-3 sm:flex lg:items-end">
            <div className="flex flex-wrap gap-2">
              <ComposerChip
                label={isVault ? "Privacy" : "Date"}
                value={isVault ? "Vault" : formatDateLabel(entryDate)}
              />
              <ComposerChip label="Words" value={wordCount.toString()} />
              <ComposerChip label="Media" value={`${mediaCount}/10`} />
            </div>

            <div className="flex gap-2">
              <Link
                href={backHref}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Cancel
              </Link>

              <Button
                type="submit"
                disabled={pending || uploading || vaultNeedsUnlock}
                className="h-11 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
              >
                {pending ? "Updating..." : isVault ? "Update Vault" : "Update Memory"}
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
                  {isVault ? "Vault privacy" : "Diary date"}
                </p>
                <p className="mt-1 hidden text-sm text-[var(--app-muted)] sm:block">
                  {isVault ? "Visible only to you." : "Use the real date this memory belongs to."}
                </p>
              </div>

              {!isVault && (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5 sm:py-2">
                  <CalendarDays size={16} className="text-[var(--app-accent)]" />
                  <input
                    type="date"
                    name="entryDate"
                    value={entryDate}
                    required
                    onChange={(event) => setEntryDate(event.target.value)}
                    className="h-9 min-w-0 bg-transparent text-sm font-semibold text-[var(--app-text)] outline-none"
                  />
                </div>
              )}

              {isVault && <input type="hidden" name="entryDate" value={entryDate} />}
              <FieldError message={state.errors?.entryDate?.[0]} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3.5 sm:p-6 lg:overflow-hidden">
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isVault
                    ? "A thought I want to keep..."
                    : "Give this memory a gentle title..."
                }
                className="w-full border-none bg-transparent font-brand text-xl font-semibold leading-tight text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-4xl"
              />
              <FieldError message={state.errors?.title?.[0]} />

              <div className="my-3.5 h-px bg-[var(--app-border)] sm:my-5" />

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
                className="min-h-[52dvh] w-full flex-1 resize-none border-none bg-transparent text-[15.5px] leading-7 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:min-h-[460px] sm:text-[17px] sm:leading-8 lg:min-h-0"
              />
              <FieldError message={state.errors?.content?.[0]} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-muted)] sm:justify-between sm:px-6 lg:shrink-0">
              <span className="hidden sm:inline">
                {isVault ? "Private writing stays in Vault." : "Calendar and profile views update after save."}
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
                  {isVault ? "Vault details" : "Memory details"}
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Update only what changed.
                </p>
              </div>
              <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                {mediaCount}/10 media
              </span>
            </div>

            <SidePanelSection
              icon={<Sparkles size={17} />}
              title="Mood"
              description="Choose the feeling for this entry."
              defaultOpen
            >
                <MoodSelector
                  moods={moodOptions}
                  selectedMoods={selectedMoods}
                  onChange={setSelectedMoods}
                />
                <FieldError message={state.errors?.moods?.[0]} />
            </SidePanelSection>

            <SidePanelSection
              icon={<LockKeyhole size={17} />}
              title="Privacy"
              description={selectedPrivacy?.description ?? "You control visibility."}
              defaultOpen={!isVault}
            >
                <input type="hidden" name="privacy" value={privacy} />
                <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--app-text)]">
                        {isVault ? "Vault" : selectedPrivacy?.label ?? "Private"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                        {isVault ? "Only you can see this entry." : selectedPrivacy?.description}
                      </p>
                    </div>

                    {!isVault && (
                    <button
                      type="button"
                      onClick={() => setPrivacyDialogOpen(true)}
                      className="shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-accent)] transition hover:border-[var(--app-accent)]"
                    >
                      Change
                    </button>
                    )}
                  </div>
                </div>

                {vaultNeedsUnlock && (
                  <div className="mt-4">
                    <VaultAccessPanel
                      hasPasscode={Boolean(vaultAccess?.hasPasscode)}
                    />
                  </div>
                )}

                <FieldError message={state.errors?.privacy?.[0]} />
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

            <TextField
                icon={<Tags size={16} />}
                label="Tags"
                name="tags"
                value={tags}
                placeholder="sunset, peace, family"
                onChange={setTags}
              />

            <SidePanelSection
              icon={<UploadCloud size={17} />}
              title={isVault ? "Private media" : "Media"}
              description="Remove existing attachments or add new ones."
              action={`${mediaCount}/10`}
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
                disabled={uploading || mediaCount >= 10}
                className="flex min-h-[84px] w-full flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3 text-center transition hover:border-[var(--app-accent)] disabled:opacity-60 sm:min-h-[112px] sm:rounded-[1.5rem] sm:p-5 lg:min-h-[88px] lg:p-3"
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

              <p className="mt-3 hidden text-xs leading-5 text-[var(--app-muted)] sm:block">
                Large images are optimized before upload. Videos keep their original file and must stay under the upload limit.
              </p>

              {(existingMedia.length > 0 || uploadedAssets.length > 0) && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
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
          {isVault ? "Vault" : selectedPrivacy?.label ?? "Private"} - {mediaCount}/10 media
        </p>
        <Button
          type="submit"
          disabled={pending || uploading || vaultNeedsUnlock}
          className="h-12 w-full rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
        >
          {pending ? "Updating..." : isVault ? "Update Vault" : "Update Memory"}
          {!pending && <ArrowRight size={17} />}
        </Button>
      </div>

      <PrivacyVisibilityDialog
        isOpen={privacyDialogOpen}
        selectedPrivacy={privacy}
        onClose={() => setPrivacyDialogOpen(false)}
        onSelect={(nextPrivacy) => {
          setPrivacy(nextPrivacy);
          setPrivacyDialogOpen(false);
        }}
      />
      </form>
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

function PrivacyVisibilityDialog({
  isOpen,
  selectedPrivacy,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  selectedPrivacy: (typeof MEMORY_PRIVACY_OPTIONS)[number]["value"];
  onClose: () => void;
  onSelect: (privacy: (typeof MEMORY_PRIVACY_OPTIONS)[number]["value"]) => void;
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
      aria-labelledby="edit-privacy-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_90px_var(--app-shadow)] sm:rounded-[2rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-privacy-dialog-title"
              className="font-brand text-xl font-semibold text-[var(--app-text)]"
            >
              Change visibility
            </h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Choose who can see this memory.
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

        <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[64vh]">
          {MEMORY_PRIVACY_OPTIONS.map((item) => {
            const selected = selectedPrivacy === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.15rem] border p-3 text-left transition",
                  selected
                    ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                <LockKeyhole size={17} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
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
    <div className="group relative h-24 w-28 shrink-0 overflow-hidden rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]">
      {isImage ? (
        <img
          src={url}
          alt={asset.fileName}
          className="h-full w-full object-cover"
        />
      ) : (
        <video src={url} className="h-full w-full object-cover" muted controls />
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
