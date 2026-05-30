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

      if (!result.success || !result.conversationId) {
        setMessage(result.message);
        return;
      }

      router.push(`/messages/${result.conversationId}`);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startConversation}
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <MessageCircle size={17} />
        )}
        Message
      </button>

      {message && <p className="text-xs font-medium text-rose-500">{message}</p>}
    </div>
  );
}