"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { startDirectConversationAction } from "@/app/actions/messages";

type StartConversationButtonProps = {
  targetUserId: string;
};

export function StartConversationButton({
  targetUserId,
}: StartConversationButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function startConversation() {
    setMessage("");

    startTransition(async () => {
      const result = await startDirectConversationAction(targetUserId);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (!result.username) {
        setMessage("Unable to open this conversation. Username not found.");
        return;
      }

      router.push(`/messages/${result.username}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startConversation}
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] shadow-[0_14px_34px_var(--app-shadow)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <MessageCircle size={17} />
        )}
        {isPending ? "Opening..." : "Message"}
      </button>

      {message && (
        <p className="max-w-[260px] text-xs font-medium leading-5 text-rose-500">
          {message}
        </p>
      )}
    </div>
  );
}