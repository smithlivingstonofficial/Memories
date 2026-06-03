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
  createMemoryAction,
  type CreateMemoryState,
} from "@/app/actions/memories";
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
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/create/mood-selector";
import { MEMORY_MOODS } from "@/lib/moods";
import { MEMORY_PRIVACY_OPTIONS } from "@/lib/memories/privacy";
import { VaultAccessPanel } from "@/components/vault/vault-access-screen";
import {
  getQuickMemoryDraftKey,
  QUICK_MEMORY_CLEAR_FLAG,
  type QuickMemoryDraft,
} from "@/lib/quick-memory-draft";
import { cn } from "@/lib/utils";

const initialState: CreateMemoryState = {
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

type CreateMemoryScreenProps = {
  initialEntryDate?: string;
  draftSource?: "quick";
  user?: {
    id?: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  vaultAccess?: {
    hasPasscode: boolean;
    isUnlocked: boolean;
  };
};

export function CreateMemoryScreen({
  initialEntryDate,
  draftSource,
  user,
  vaultAccess,
}: CreateMemoryScreenProps) {
  const [state, formAction, pending] = useActionState(
    createMemoryAction,
    initialState
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entryDate, setEntryDate] = useState(() =>
    normalizeDateInput(initialEntryDate)
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Peaceful"]);
  const [privacy, setPrivacy] =
    useState<(typeof MEMORY_PRIVACY_OPTIONS)[number]["value"]>("private");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSource, setLocationSource] =
    useState<LocationSource>("unknown");
  const [locationConfidence, setLocationConfidence] = useState<number | null>(
    null
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [tags, setTags] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  const selectedPrivacy = useMemo(
    () => MEMORY_PRIVACY_OPTIONS.find((item) => item.value === privacy),
    [privacy]
  );
  const vaultNeedsUnlock = privacy === "vault" && !vaultAccess?.isUnlocked;

  const wordCount = useMemo(() => {
    return content.trim().length === 0
      ? 0
      : content.trim().split(/\s+/).length;
  }, [content]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const draft = readQuickDraft(user?.id, draftSource);

      setTitle(draft.title);
      setContent(draft.content);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftSource, user?.id]);

  useEffect(() => {
    if (draftSource === "quick" && user?.id && state.message) {
      sessionStorage.removeItem(QUICK_MEMORY_CLEAR_FLAG);
    }
  }, [draftSource, state.message, user?.id]);

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
          purpose: privacy === "vault" ? "vault" : "memory",
          visibility:
            privacy === "public"
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
      setUploadMessage("Media uploaded successfully.");

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

  function removeAsset(assetId: string) {
    setUploadedAssets((current) =>
      current.filter((asset) => asset.assetId !== assetId)
    );
    void deleteUploadedMedia(assetId);
  }

  function saveQuickDraft(nextTitle: string, nextContent: string) {
    if (draftSource !== "quick" || !user?.id) return;

    const draftKey = getQuickMemoryDraftKey(user.id);

    if (!nextTitle.trim() && !nextContent.trim()) {
      localStorage.removeItem(draftKey);
      return;
    }

    const draft: QuickMemoryDraft = {
      title: nextTitle,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    saveQuickDraft(value, content);
  }

  function handleContentChange(value: string) {
    setContent(value);
    saveQuickDraft(title, value);
  }

  function handleLocationNameChange(value: string) {
    setLocationName(value);

    if (!latitude || !longitude) {
      setLocationSource(value.trim() ? "manual" : "unknown");
    }
  }

  function handleSubmit() {
    if (draftSource === "quick" && user?.id) {
      sessionStorage.setItem(QUICK_MEMORY_CLEAR_FLAG, user.id);
    }
  }

  return (
    <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-[1500px] sm:mx-auto sm:w-full lg:h-[calc(100dvh-3rem)] lg:min-h-0">
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="space-y-3 pb-[13rem] sm:space-y-4 sm:pb-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-4 lg:overflow-hidden"
      >
        <input
          type="hidden"
          name="moods"
          value={JSON.stringify(selectedMoods)}
        />

        <input type="hidden" name="entryTimezone" value="Asia/Kolkata" />

        <input
          type="hidden"
          name="mediaAssetIds"
          value={JSON.stringify(uploadedAssets.map((asset) => asset.assetId))}
        />

        <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4 lg:shrink-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/create"
                className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:mb-1"
              >
                <ArrowLeft size={16} />
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to Create</span>
              </Link>

              <div className="flex min-w-0 items-center gap-3 sm:flex-wrap">
                <h1 className="min-w-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:text-4xl lg:text-3xl">
                  Create Memory
                </h1>

                <span className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
                  <Sparkles size={14} />
                  Writer
                </span>
              </div>

              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-[var(--app-muted)] sm:block lg:hidden">
                A focused place for the words first. Add mood, privacy, media,
                and place when they help the memory feel complete.
              </p>

              {user?.username && (
                <p className="mt-1 truncate text-xs font-medium text-[var(--app-muted)] sm:mt-2">
                  @{user.username}
                  <span className="hidden sm:inline"> writing</span>
                </p>
              )}
            </div>

            <div className="hidden flex-col gap-3 sm:flex lg:items-end">
              <div className="flex flex-wrap gap-2">
                <ComposerChip label="Date" value={formatDateLabel(entryDate)} />
                <ComposerChip
                  label="Privacy"
                  value={selectedPrivacy?.label ?? "Private"}
                />
                <ComposerChip
                  label="Media"
                  value={`${uploadedAssets.length}/10`}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/create"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  disabled={pending || uploading || vaultNeedsUnlock}
                  className="h-11 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
                >
                  {pending ? "Saving..." : "Save Memory"}
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
                    Diary date
                  </p>
                  <p className="mt-1 hidden text-sm text-[var(--app-muted)] sm:block">
                    Use the real date this memory belongs to.
                  </p>
                </div>

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

                <FieldError message={state.errors?.entryDate?.[0]} />
              </div>

              <div className="flex min-h-0 flex-1 flex-col p-3.5 sm:p-6 lg:overflow-hidden">
                <label className="sr-only" htmlFor="memory-title">
                  Memory title
                </label>

                <input
                  id="memory-title"
                  name="title"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Give this memory a gentle title..."
                  className="w-full border-none bg-transparent font-brand text-xl font-semibold leading-tight text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-4xl"
                />

                <FieldError message={state.errors?.title?.[0]} />

                <div className="my-3.5 h-px bg-[var(--app-border)] sm:my-5" />

                <label className="sr-only" htmlFor="memory-content">
                  Your memory
                </label>

                <textarea
                  id="memory-content"
                  name="content"
                  value={content}
                  onChange={(event) => handleContentChange(event.target.value)}
                  placeholder="Start writing what happened, how it felt, and why you want to remember it..."
                  rows={16}
                  className="min-h-[52dvh] w-full flex-1 resize-none border-none bg-transparent text-[15.5px] leading-7 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:min-h-[460px] sm:text-[17px] sm:leading-8 lg:min-h-0"
                />

                <FieldError message={state.errors?.content?.[0]} />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-muted)] sm:justify-between sm:px-6 lg:shrink-0">
                <span className="hidden sm:inline">
                  Write naturally. No pressure. This space is yours.
                </span>
                <span className="font-semibold">
                  {wordCount} words - {readingTime} min read
                </span>
              </div>
            </div>
          </section>

          <aside className="min-w-0 lg:min-h-0">
            <div className="space-y-3 sm:space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              <div className="hidden items-center justify-between rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 lg:flex">
                <div>
                  <h2 className="font-brand text-lg font-semibold text-[var(--app-text)]">
                    Memory details
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">
                    Add only what helps this memory.
                  </p>
                </div>

                <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  {wordCount} words
                </span>
              </div>
              <SidePanelSection
                icon={<LockKeyhole size={17} />}
                title="Privacy"
                description={selectedPrivacy?.description ?? "You control visibility."}
                defaultOpen
              >
                <input type="hidden" name="privacy" value={privacy} />

                <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--app-text)]">
                        {selectedPrivacy?.label ?? "Private"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                        {selectedPrivacy?.description ?? "You control visibility."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrivacyDialogOpen(true)}
                      className="shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-accent)] transition hover:border-[var(--app-accent)]"
                    >
                      Change
                    </button>
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

              <SidePanelSection
                icon={<Sparkles size={17} />}
                title="Mood"
                description="Choose up to five feelings for this memory."
              >
                <MoodSelector
                  moods={MEMORY_MOODS}
                  selectedMoods={selectedMoods}
                  onChange={setSelectedMoods}
                />

                <FieldError message={state.errors?.moods?.[0]} />
              </SidePanelSection>

              <SidePanelSection
                icon={<UploadCloud size={17} />}
                title="Media"
                description="Attach photos or videos if they add meaning."
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
                    {uploading ? "Uploading media..." : "Upload media"}
                  </p>

                  <p className="mt-1 hidden max-w-sm text-xs leading-5 text-[var(--app-muted)] sm:block">
                    JPG, PNG, WEBP, GIF, MP4, and WEBM.
                  </p>
                </button>

                {uploadMessage && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {uploadMessage}
                  </p>
                )}

                <p className="mt-3 hidden text-xs leading-5 text-[var(--app-muted)] sm:block">
                  Large images are optimized before upload. Videos keep their
                  original file and must stay under the upload limit.
                </p>

                {uploadedAssets.length > 0 && (
                  <MediaThumbnailStrip
                    assets={uploadedAssets}
                    onRemove={removeAsset}
                  />
                )}
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
                description="Use commas to keep this memory searchable later."
              >
                <input
                  name="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="sunset, peace, family"
                  className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
                />
              </SidePanelSection>

              <div className="hidden mem-card rounded-[2rem] p-4 sm:block lg:hidden">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                    <LockKeyhole size={17} />
                  </div>

                  <div>
                    <h3 className="font-brand text-base font-semibold text-[var(--app-text)]">
                      Privacy reminder
                    </h3>
                    <p className="text-xs text-[var(--app-muted)]">
                      You control visibility.
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-[var(--app-muted)]">
                  Media is uploaded to Cloudflare R2. Visibility follows your
                  selected privacy setting and Supabase access rules.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {state.message && (
          <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-500 lg:shrink-0 lg:py-3">
            {state.message}
          </div>
        )}

        <div className="fixed inset-x-2 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
          <div>
            <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
              {selectedPrivacy?.label ?? "Private"} - {uploadedAssets.length}/10
              media
            </p>

            <Button
              type="submit"
              disabled={pending || uploading || vaultNeedsUnlock}
              className="h-12 w-full rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)]"
            >
              {pending ? "Saving..." : "Save Memory"}
              {!pending && <ArrowRight size={17} />}
            </Button>
          </div>
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

function MediaThumbnailStrip({
  assets,
  onRemove,
}: {
  assets: UploadedAsset[];
  onRemove: (assetId: string) => void;
}) {
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
      {assets.map((asset) => (
        <div
          key={asset.assetId}
          className="group relative h-24 w-28 shrink-0 overflow-hidden rounded-[1.1rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]"
        >
          {asset.mimeType.startsWith("image/") ? (
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
            />
          )}

          <button
            type="button"
            onClick={() => onRemove(asset.assetId)}
            className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-xl bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-rose-600"
            aria-label={`Remove ${asset.fileName}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
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
      aria-labelledby="privacy-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_90px_var(--app-shadow)] sm:rounded-[2rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="privacy-dialog-title"
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-500">{message}</p>;
}

function getTodayInputValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function isValidDateInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDateInput(value?: string) {
  return isValidDateInput(value) ? value! : getTodayInputValue();
}

function readQuickDraft(
  userId?: string,
  draftSource?: "quick"
): Pick<QuickMemoryDraft, "title" | "content"> {
  if (draftSource !== "quick" || !userId || typeof window === "undefined") {
    return {
      title: "",
      content: "",
    };
  }

  try {
    const rawDraft = localStorage.getItem(getQuickMemoryDraftKey(userId));
    if (!rawDraft) {
      return {
        title: "",
        content: "",
      };
    }

    const draft = JSON.parse(rawDraft) as Partial<QuickMemoryDraft>;

    return {
      title: typeof draft.title === "string" ? draft.title : "",
      content: typeof draft.content === "string" ? draft.content : "",
    };
  } catch {
    return {
      title: "",
      content: "",
    };
  }
}

function formatDateLabel(value: string) {
  if (!isValidDateInput(value)) return "Today";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
