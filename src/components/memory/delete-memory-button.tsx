"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { deleteMemoryAction } from "@/app/actions/memories";
import { cn } from "@/lib/utils";

type DeleteMemoryButtonProps = {
  memoryId: string;
  type?: "memory" | "vault";
  variant?: "icon" | "text";
  className?: string;
};

export function DeleteMemoryButton({
  memoryId,
  type = "memory",
  variant = "icon",
  className,
}: DeleteMemoryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const title = type === "vault" ? "Delete Vault entry?" : "Delete memory?";
  const description =
    type === "vault"
      ? "This will permanently delete this Vault entry and remove its unused attached media from Cloudflare R2."
      : "This will permanently delete this memory and remove its unused attached media from Cloudflare R2.";

  function handleDelete() {
    setMessage("");

    startTransition(async () => {
      const result = await deleteMemoryAction(memoryId);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          variant === "icon"
            ? "flex size-9 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-sm transition hover:text-rose-500"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/15",
          className
        )}
        aria-label={type === "vault" ? "Delete Vault entry" : "Delete memory"}
      >
        <Trash2 size={variant === "icon" ? 16 : 15} />
        {variant === "text" && <span>Delete</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <Trash2 size={22} />
                </div>

                <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {message && (
              <div className="mb-4 rounded-2xl border border-rose-300/40 bg-rose-500/10 p-3 text-sm leading-6 text-rose-500">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60 sm:flex-1"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(244,63,94,0.24)] transition hover:bg-rose-600 disabled:opacity-60 sm:flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}