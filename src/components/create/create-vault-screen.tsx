"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createVaultEntryAction,
  type CreateVaultEntryState,
} from "@/app/actions/memories";
import { uploadMedia } from "@/lib/media/upload-media";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/create/mood-selector";
import { VAULT_MOODS } from "@/lib/moods";

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
};

export function CreateVaultScreen() {
  const [state, formAction, pending] = useActionState(
    createVaultEntryAction,
    initialState
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Thoughtful"]);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const wordCount = useMemo(() => {
    return content.trim().length === 0
      ? 0
      : content.trim().split(/\s+/).length;
  }, [content]);

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
          purpose: "vault",
          visibility: "private",
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
      setUploadMessage("Private media uploaded successfully.");
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
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="relative mb-5 overflow-hidden rounded-[2rem] border border-[var(--app-border)] p-5 shadow-[0_24px_80px_var(--app-shadow)] [background:var(--vault-hero)] sm:p-6">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[#6366F1]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 size-64 rounded-full bg-[#FFE4E6]/25 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/create"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
            >
              <ArrowLeft size={16} />
              Back to Create
            </Link>

            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <LockKeyhole size={14} />
              Vault Writer
            </p>

            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Your private world.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Write thoughts that are only for you. Vault entries are private by
              default and never appear in Home or Discover.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <VaultInfoPill label="Privacy" value="Only you" />
            <VaultInfoPill label="Words" value={wordCount.toString()} />
            <VaultInfoPill
              label="Media"
              value={uploadedAssets.length.toString()}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <form action={formAction} className="space-y-6">
            <input
              type="hidden"
              name="moods"
              value={JSON.stringify(selectedMoods)}
            />

            <input
              type="hidden"
              name="mediaAssetIds"
              value={JSON.stringify(
                uploadedAssets.map((asset) => asset.assetId)
              )}
            />

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                Vault title
              </label>

              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="A thought I want to keep..."
                className="h-14 w-full border-none bg-transparent font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)] sm:text-3xl"
              />

              <FieldError message={state.errors?.title?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4 sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
                Private diary
              </label>

              <textarea
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write freely. This space is private..."
                rows={13}
                className="min-h-[340px] w-full resize-none border-none bg-transparent text-[16px] leading-8 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)]"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                <p className="text-xs text-[var(--app-muted)]">
                  No likes. No reflections. No public sharing.
                </p>

                <p className="text-xs font-medium text-[var(--app-muted)]">
                  {wordCount} words
                </p>
              </div>

              <FieldError message={state.errors?.content?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4">
              <MoodSelector
                moods={VAULT_MOODS}
                selectedMoods={selectedMoods}
                onChange={setSelectedMoods}
              />

              <FieldError message={state.errors?.moods?.[0]} />
            </div>

            <div className="mem-card-strong rounded-[1.7rem] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--app-text)]">
                    Private media
                  </label>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    Optional photos or videos connected to this Vault entry.
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
                  {uploading ? "Uploading privately..." : "Upload private media"}
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--app-muted)]">
                  Media is stored privately in Cloudflare R2.
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
                  {pending ? "Saving to Vault..." : "Save to Vault"}
                  {!pending && <ArrowRight size={17} />}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="sticky top-4 space-y-5">
            <VaultPreview
              title={title}
              content={content}
              moods={selectedMoods}
              media={uploadedAssets[0]}
            />

            <div className="mem-card rounded-[2rem] p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                    Only you can see this
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">
                    Vault is private.
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-[var(--app-muted)]">
                Vault entries are saved with private visibility and are not
                shown in Home, Discover, public profiles, or Inner Circle feeds.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function VaultInfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function VaultPreview({
  title,
  content,
  moods,
  media,
}: {
  title: string;
  content: string;
  moods: string[];
  media?: UploadedAsset;
}) {
  return (
    <div className="mem-card rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          Vault Preview
        </h2>

        <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          Private
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
          {moods.map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}

          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
            <LockKeyhole size={12} />
            Vault
          </span>
        </div>

        <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          {title || "Untitled Vault entry"}
        </h3>

        <p className="mt-2 line-clamp-6 text-sm leading-6 text-[var(--app-muted)]">
          {content || "Your private writing preview will appear here..."}
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-500">{message}</p>;
}
