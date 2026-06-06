"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Globe2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import {
  updateProfileAction,
  type UpdateProfileState,
} from "@/app/actions/profile";
import { deleteUploadedMedia } from "@/lib/media/delete-uploaded-media";
import { prepareMediaForUpload } from "@/lib/media/client-media-processing";
import { uploadMedia } from "@/lib/media/upload-media";
import { Button } from "@/components/ui/button";

type EditProfileScreenProps = {
  initialProfile: {
    fullName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    accountVisibility: "public" | "private";
  };
};

const initialState: UpdateProfileState = {
  message: "",
  errors: {},
};

type UploadedProfileAsset = {
  assetId: string;
  previewUrl: string;
};

export function EditProfileScreen({ initialProfile }: EditProfileScreenProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState
  );

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [username, setUsername] = useState(initialProfile.username);
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [accountVisibility, setAccountVisibility] = useState<
    "public" | "private"
  >(initialProfile.accountVisibility);

  const [avatarAsset, setAvatarAsset] = useState<UploadedProfileAsset | null>(
    null
  );
  const [coverAsset, setCoverAsset] = useState<UploadedProfileAsset | null>(
    null
  );

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const avatarPreview = avatarAsset?.previewUrl ?? initialProfile.avatarUrl;
  const coverPreview = coverAsset?.previewUrl ?? initialProfile.coverUrl;

  async function uploadProfileImage(
    file: File,
    purpose: "profile_avatar" | "profile_cover"
  ) {
    const prepared = await prepareMediaForUpload(file);
    const result = await uploadMedia({
      file: prepared.file,
      purpose,
      visibility: "public",
      originalFileSize: prepared.originalSize,
      optimizedFileSize: prepared.optimizedSize,
      optimizationStatus: prepared.status,
    });

    return {
      assetId: result.assetId,
      previewUrl: URL.createObjectURL(prepared.file),
    };
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;

    setUploadMessage("");
    setAvatarUploading(true);

    try {
      const uploaded = await uploadProfileImage(file, "profile_avatar");
      const previousAssetId = avatarAsset?.assetId;
      setAvatarAsset(uploaded);
      if (previousAssetId) {
        void deleteUploadedMedia(previousAssetId);
      }
      setUploadMessage("Profile photo uploaded. Save changes to apply it.");
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Unable to upload avatar."
      );
    } finally {
      setAvatarUploading(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  async function handleCoverChange(file: File | undefined) {
    if (!file) return;

    setUploadMessage("");
    setCoverUploading(true);

    try {
      const uploaded = await uploadProfileImage(file, "profile_cover");
      const previousAssetId = coverAsset?.assetId;
      setCoverAsset(uploaded);
      if (previousAssetId) {
        void deleteUploadedMedia(previousAssetId);
      }
      setUploadMessage("Cover image uploaded. Save changes to apply it.");
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Unable to upload cover."
      );
    } finally {
      setCoverUploading(false);

      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <Link
          href="/profile"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>

        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <UserRound size={14} />
          Edit Profile
        </p>

        <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
          Shape your public identity.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
          Update your profile photo, cover, name, username, bio, and account
          privacy.
        </p>
      </section>

      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="avatarAssetId"
          value={avatarAsset?.assetId ?? ""}
        />
        <input
          type="hidden"
          name="coverAssetId"
          value={coverAsset?.assetId ?? ""}
        />
        <input
          type="hidden"
          name="accountVisibility"
          value={accountVisibility}
        />

        <section className="mem-card overflow-hidden rounded-[2rem]">
          <div className="relative h-56 overflow-hidden sm:h-72">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center [background:var(--vault-hero)]">
                <ImagePlus className="text-[var(--app-accent)]" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleCoverChange(event.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute right-4 top-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-white/30 bg-white/85 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white disabled:opacity-60"
            >
              {coverUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              Change cover
            </button>
          </div>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="relative size-28 shrink-0 sm:size-32">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="size-full rounded-[2rem] border-4 border-[var(--app-surface-strong)] object-cover shadow-[0_22px_60px_var(--app-shadow)]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-[2rem] border-4 border-[var(--app-surface-strong)] bg-[var(--app-soft)] font-brand text-3xl font-semibold text-[var(--app-accent)] shadow-[0_22px_60px_var(--app-shadow)]">
                    {fullName[0]?.toUpperCase() ?? "M"}
                  </div>
                )}

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    handleAvatarChange(event.target.files?.[0])
                  }
                />

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-2 -right-2 flex size-11 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-white shadow-[0_16px_38px_rgba(99,102,241,0.28)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
                  aria-label="Change profile photo"
                >
                  {avatarUploading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Camera size={17} />
                  )}
                </button>
              </div>

              <div className="min-w-0 pb-1">
                <h2 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)]">
                  {fullName || "Your name"}
                </h2>
                <p className="mt-1 text-sm font-medium text-[var(--app-muted)]">
                  @{username || "username"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {uploadMessage && (
          <div className="mem-card rounded-2xl p-4 text-sm leading-6 text-[var(--app-muted)]">
            <div className="flex gap-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-500"
              />
              <p>{uploadMessage}</p>
            </div>
          </div>
        )}

        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
                Full name
              </label>
              <input
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Smith Livingston"
                className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all focus:border-[var(--app-accent)]"
              />
              <FieldError message={state.errors?.fullName?.[0]} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
                Username
              </label>
              <input
                name="username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                  )
                }
                placeholder="smith_memories"
                className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all focus:border-[var(--app-accent)]"
              />
              <FieldError message={state.errors?.username?.[0]} />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Bio
            </label>
            <textarea
              name="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={180}
              rows={4}
              placeholder="Write a short line about your memories, life, or creative world..."
              className="mem-input w-full resize-none rounded-[1.4rem] px-4 py-3 text-[15px] leading-7 outline-none transition-all focus:border-[var(--app-accent)]"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <FieldError message={state.errors?.bio?.[0]} />
              <p className="ml-auto text-xs text-[var(--app-muted)]">
                {bio.length}/180
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-3 block text-sm font-semibold text-[var(--app-text)]">
              Account privacy
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAccountVisibility("public")}
                className={
                  accountVisibility === "public"
                    ? "rounded-[1.4rem] border border-[var(--app-accent)] bg-[var(--app-soft)] p-4 text-left text-[var(--app-accent)]"
                    : "rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-left text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                }
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[var(--app-surface-strong)]">
                  <Globe2 size={18} />
                </div>

                <p className="text-sm font-semibold">Public account</p>
                <p className="mt-1 text-xs leading-5 opacity-75">
                  People can view your public profile and public memories.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccountVisibility("private")}
                className={
                  accountVisibility === "private"
                    ? "rounded-[1.4rem] border border-[var(--app-accent)] bg-[var(--app-soft)] p-4 text-left text-[var(--app-accent)]"
                    : "rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-left text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                }
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[var(--app-surface-strong)]">
                  <LockKeyhole size={18} />
                </div>

                <p className="text-sm font-semibold">Private account</p>
                <p className="mt-1 text-xs leading-5 opacity-75">
                  People can see your basic profile, but your memories stay
                  hidden.
                </p>
              </button>
            </div>

            <FieldError message={state.errors?.accountVisibility?.[0]} />
          </div>

          {state.message && (
            <div className="mt-5 rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-500">
              {state.message}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/profile"
              className="flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:flex-1"
            >
              Cancel
            </Link>

            <Button
              type="submit"
              disabled={pending || avatarUploading || coverUploading}
              className="h-12 rounded-2xl bg-[var(--app-accent)] text-[15px] font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] hover:bg-[var(--app-accent-hover)] sm:flex-[1.4]"
            >
              {pending ? "Saving profile..." : "Save Profile"}
              {!pending && <ArrowRight size={17} />}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-500">{message}</p>;
}
