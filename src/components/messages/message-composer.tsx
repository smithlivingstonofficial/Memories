"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import {
  sendMessageAction,
  type SendMessageState,
} from "@/app/actions/messages";

const initialState: SendMessageState = {
  success: false,
  message: "",
};

type MessageComposerProps = {
  conversationId: string;
};

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, pending] = useActionState(
    sendMessageAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-t border-[var(--app-border)] p-4"
    >
      <input type="hidden" name="conversationId" value={conversationId} />

      <div className="flex gap-3">
        <textarea
          name="body"
          rows={2}
          placeholder="Write a message..."
          className="mem-input min-h-12 flex-1 resize-none rounded-[1.4rem] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--app-accent)]"
        />

        <button
          type="submit"
          disabled={pending}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-white transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
          aria-label="Send message"
        >
          {pending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {state.message && !state.success && (
        <p className="mt-2 text-xs font-medium text-rose-500">
          {state.message}
        </p>
      )}
    </form>
  );
}