"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteReflectionAction } from "@/app/actions/engagements";

type DeleteReflectionButtonProps = {
  reflectionId: string;
};

export function DeleteReflectionButton({
  reflectionId,
}: DeleteReflectionButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setMessage("");

    const confirmed = window.confirm(
      "Delete this reflection? This action cannot be undone."
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteReflectionAction(reflectionId);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex size-9 items-center justify-center rounded-2xl border border-rose-300/40 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/15 disabled:opacity-60"
        aria-label="Delete reflection"
      >
        {isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
      </button>

      {message && <p className="text-xs font-medium text-rose-500">{message}</p>}
    </div>
  );
}