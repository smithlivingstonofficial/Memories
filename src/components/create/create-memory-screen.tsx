"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  MapPin,
  Sparkles,
  Tags,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createMemoryAction,
  type CreateMemoryState,
} from "@/app/actions/memories";
import { uploadMedia } from "@/lib/media/upload-media";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/create/mood-selector";
import { MEMORY_MOODS } from "@/lib/moods";
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

const privacyOptions = [
  {
    value: "private",
    label: "Private",
    description: "Only you can see this memory.",
  },
  {
    value: "inner_circle",
    label: "Inner Circle",
    description: "Only trusted people can see this.",
  },
  {
    value: "public",
    label: "Public",
    description: "Visible in Discover.",
  },
] as const;

type UploadedAsset = {
  assetId: string;
  objectKey: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  previewUrl: string;
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
};

export function CreateMemoryScreen({
  initialEntryDate,
  draftSource,
  user,
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
    useState<(typeof privacyOptions)[number]["value"]>("private");
  const [locationName, setLocationName] = useState("");
  const [tags, setTags] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const selectedPrivacy = useMemo(
    () => privacyOptions.find((item) => item.value === privacy),
    [privacy]
  );

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

      for (const file of selectedFiles) {
        const result = await uploadMedia({
          file,
          purpose: "memory",
          visibility:
            privacy === "public"
              ? "public"
              : privacy === "inner_circle"
                ? "inner_circle"
                : "private",
        });

        uploaded.push({
          assetId: result.assetId,
          objectKey: result.objectKey,
          publicUrl: result.publicUrl,
          fileName: file.name,
          mimeType: file.type,
          previewUrl: URL.createObjectURL(file),
        });
      }

      setUploadedAssets((current) => [...current, ...uploaded]);
      setUploadMessage("Media uploaded successfully.");
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

  function handleSubmit() {
    if (draftSource === "quick" && user?.id) {
      sessionStorage.setItem(QUICK_MEMORY_CLEAR_FLAG, user.id);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="mem-card mb-5 rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/create"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
            >
              <ArrowLeft size={16} />
              Back to Create
            </Link>

            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <Sparkles size={14} />
              Diary Memory Writer
            </p>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Write something worth remembering.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              A calm diary-first space to save your thoughts, photos, mood, and
              meaning.
            </p>

            {user?.username && (
              <p className="mt-2 text-xs font-medium text-[var(--app-muted)]">
                Writing as @{user.username}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoPill label="Date" value={formatDateLabel(entryDate)} />
            <InfoPill label="Words" value={wordCount.toString()} />
            <InfoPill label="Read" value={`${readingTime} min`} />
            <InfoPill label="Media" value={uploadedAssets.length.toString()} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
            <input
              type="hidden"
              name="moods"
              value={JSON.stringify(selectedMoods)}
            />

            <input type="hidden" name="entryTimezone" value="Asia/Kolkata" />

            <input
              type="hidden"
              name="mediaAssetIds"
              value={JSON.stringify(
                uploadedAssets.map((asset) => asset.assetId)
              )}
            />

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                    Diary date
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">
                    Choose the real date this memory belongs to.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
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

              <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
                If you write today about yesterday, select yesterday. Calendar,
                dashboard, and timeline will use this date.
              </p>

              <FieldError message={state.errors?.entryDate?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                Memory title
              </label>

              <input
                name="title"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Give this memory a gentle title..."
                className="h-14 w-full border-none bg-transparent font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-3xl"
              />

              <FieldError message={state.errors?.title?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                Your memory
              </label>

              <textarea
                name="content"
                value={content}
                onChange={(event) => handleContentChange(event.target.value)}
                placeholder="Start writing what happened, how it felt, and why you want to remember it..."
                rows={12}
                className="min-h-[320px] w-full resize-none border-none bg-transparent text-[16px] leading-8 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)]"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                <p className="text-xs text-[var(--app-muted)]">
                  Write naturally. No pressure. This space is yours.
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
                  moods={MEMORY_MOODS}
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
                  {privacyOptions.map((item) => (
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

                <FieldError message={state.errors?.privacy?.[0]} />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="mem-card-strong rounded-[1.7rem] p-4">
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--app-text)]">
                  <MapPin size={16} />
                  Location
                </label>

                <input
                  name="locationName"
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                  placeholder="Coimbatore, Tamil Nadu"
                  className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
                />
              </div>

              <div className="mem-card-strong rounded-[1.7rem] p-4">
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--app-text)]">
                  <Tags size={16} />
                  Tags
                </label>

                <input
                  name="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="sunset, peace, family"
                  className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
                />
              </div>
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--app-text)]">
                    Photos or videos
                  </label>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    Add media only if it helps this memory feel complete.
                  </p>
                </div>

                <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  {uploadedAssets.length}/10
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
                disabled={uploading || uploadedAssets.length >= 10}
                className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] p-6 text-center transition hover:border-[var(--app-accent)] disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="mb-3 animate-spin text-[var(--app-accent)]" />
                ) : (
                  <UploadCloud className="mb-3 text-[var(--app-accent)]" />
                )}

                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {uploading ? "Uploading media..." : "Upload photos or videos"}
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--app-muted)]">
                  JPG, PNG, WEBP, GIF, MP4, and WEBM supported.
                </p>
              </button>

              {uploadMessage && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--app-muted)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {uploadMessage}
                </p>
              )}

              {uploadedAssets.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uploadedAssets.map((asset) => (
                    <div
                      key={asset.assetId}
                      className="group relative overflow-hidden rounded-[1.3rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]"
                    >
                      {asset.mimeType.startsWith("image/") ? (
                        <img
                          src={asset.previewUrl}
                          alt={asset.fileName}
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={asset.previewUrl}
                          className="h-36 w-full object-cover"
                          muted
                          controls
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeAsset(asset.assetId)}
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-xl bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {state.message && (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-500">
                {state.message}
              </div>
            )}

            <div className="sticky bottom-4 z-20 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 shadow-[0_24px_70px_var(--app-shadow)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/create"
                  className="flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:flex-1"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  disabled={pending || uploading}
                  className="h-12 rounded-2xl bg-[var(--app-accent)] text-[15px] font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)] sm:flex-[1.4]"
                >
                  {pending ? "Saving memory..." : "Save Memory"}
                  {!pending && <ArrowRight size={17} />}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="sticky top-4 space-y-5">
            <LivePreview
              title={title}
              content={content}
              moods={selectedMoods}
              privacyLabel={selectedPrivacy?.label ?? "Private"}
              locationName={locationName}
              entryDate={entryDate}
              media={uploadedAssets[0]}
            />

            <div className="mem-card rounded-[2rem] p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <LockKeyhole size={17} />
                </div>

                <div>
                  <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                    Privacy reminder
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">
                    You control visibility.
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-[var(--app-muted)]">
                Media is uploaded to Cloudflare R2. Visibility is controlled by
                your selected privacy setting and Supabase access rules.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
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

function LivePreview({
  title,
  content,
  moods,
  privacyLabel,
  locationName,
  entryDate,
  media,
}: {
  title: string;
  content: string;
  moods: string[];
  privacyLabel: string;
  locationName: string;
  entryDate: string;
  media?: UploadedAsset;
}) {
  return (
    <div className="mem-card rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          Preview
        </h2>

        <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          {privacyLabel}
        </span>
      </div>

      <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4">
        {media ? (
          media.mimeType.startsWith("image/") ? (
            <img
              src={media.previewUrl}
              alt="Preview"
              className="mb-4 h-60 w-full rounded-[1.3rem] object-cover"
            />
          ) : (
            <video
              src={media.previewUrl}
              className="mb-4 h-60 w-full rounded-[1.3rem] object-cover"
              muted
              controls
            />
          )
        ) : (
          <div className="mb-4 flex h-60 items-center justify-center rounded-[1.3rem] [background:var(--vault-hero)]">
            <ImagePlus className="text-[var(--app-accent)]" />
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
            {formatDateLabel(entryDate)}
          </span>

          {moods.map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
            {privacyLabel}
          </span>
        </div>

        <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          {title || "Untitled memory"}
        </h3>

        <p className="mt-2 line-clamp-6 text-sm leading-6 text-[var(--app-muted)]">
          {content || "Your memory preview will appear here as you write..."}
        </p>

        {locationName && (
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--app-muted)]">
            <MapPin size={14} />
            {locationName}
          </p>
        )}
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
