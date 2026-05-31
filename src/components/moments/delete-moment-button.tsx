"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteMomentAction } from "@/app/actions/moments";

type DeleteMomentButtonProps = {
  momentId: string;
};

export function DeleteMomentButton({ momentId }: DeleteMomentButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setMessage("");

    const confirmed = window.confirm(
      "Delete this Moment? This will also remove the uploaded media from Cloudflare R2."
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteMomentAction(momentId);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.push("/home");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/15 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
        Delete
      </button>

      {message && <p className="text-xs font-medium text-rose-500">{message}</p>}
    </div>
  );
}