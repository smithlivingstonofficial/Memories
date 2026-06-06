"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Globe2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { editMomentAction } from "@/app/actions/moments";
import type { EditableMoment } from "@/lib/moments/get-editable-moment";
import { cn } from "@/lib/utils";

type MomentVisibility = "public" | "followers" | "inner_circle";

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

export function EditMomentScreen({ moment }: { moment: EditableMoment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(moment.caption);
  const [visibility, setVisibility] = useState<MomentVisibility>(
    isMomentVisibility(moment.visibility) ? moment.visibility : "followers"
  );
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const selectedVisibility = visibilityOptions.find(
    (option) => option.value === visibility
  );

  function submit() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Add a Moment title before saving.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("momentId", moment.id);
      formData.append("caption", title.trim());
      formData.append("visibility", visibility);

      const result = await editMomentAction(formData);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.push(`/moment/${moment.id}`);
      router.refresh();
    });
  }

  return (
    <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-[1200px] space-y-3 pb-[13rem] sm:mx-auto sm:w-full sm:space-y-4 sm:pb-0">
      <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={`/moment/${moment.id}`}
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:mb-1"
            >
              <ArrowLeft size={16} />
              Back to Moment
            </Link>

            <p className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
              <Sparkles size={14} />
              Moment Editor
            </p>

            <h1 className="mt-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:mt-2 sm:text-4xl lg:text-3xl">
              Edit Moment
            </h1>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isPending || !title.trim()}
            className="hidden h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
          >
            {isPending ? "Updating..." : "Update Moment"}
            {!isPending && <ChevronRight size={17} />}
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-5">
          {moment.media && (
            <div className="mb-5 overflow-hidden rounded-[1.6rem] bg-slate-950">
              {moment.media.mediaKind === "image" ? (
                <Image
                  src={moment.media.url}
                  alt={title.trim() || "Moment preview"}
                  width={1200}
                  height={900}
                  unoptimized
                  className="h-[min(62vh,560px)] min-h-[360px] w-full object-contain"
                />
              ) : (
                <video
                  src={moment.media.url}
                  className="h-[min(62vh,560px)] min-h-[360px] w-full object-contain"
                  controls
                  playsInline
                />
              )}
            </div>
          )}

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
        </div>

        <aside className="space-y-4">
          <section className="mem-card-strong rounded-[1.35rem] p-4 sm:rounded-[1.8rem] sm:p-5">
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

          {message && (
            <p className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-sm leading-6 text-[var(--app-muted)]">
              {message}
            </p>
          )}
        </aside>
      </section>

      <div className="fixed inset-x-2 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
        <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
          {selectedVisibility?.label ?? "Followers"}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !title.trim()}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Updating
            </>
          ) : (
            <>
              Update Moment
              <ChevronRight size={17} />
            </>
          )}
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
      aria-labelledby="edit-moment-visibility-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_90px_var(--app-shadow)] sm:rounded-[2rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-moment-visibility-dialog-title"
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
            <X size={16} />
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

function isMomentVisibility(value?: string | null): value is MomentVisibility {
  return value === "public" || value === "followers" || value === "inner_circle";
}
