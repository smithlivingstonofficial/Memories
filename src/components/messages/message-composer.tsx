"use client";

import { FormEvent, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MessageComposerProps = {
  conversationId: string;
  currentUserId: string;
};

export type OptimisticMessageEvent = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export function MessageComposer({
  conversationId,
  currentUserId,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedBody = body.trim();
    if (!trimmedBody || sending) return;

    setMessage("");
    setBody("");
    setSending(true);

    const supabase = createClient();
    const optimisticMessage: OptimisticMessageEvent = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: currentUserId,
      body: trimmedBody,
      createdAt: new Date().toISOString(),
    };

    window.dispatchEvent(
      new CustomEvent<OptimisticMessageEvent>("memories:message-sent", {
        detail: optimisticMessage,
      })
    );

    const { error } = await supabase.from("messages").insert({
      id: optimisticMessage.id,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmedBody,
    });

    if (error) {
      setMessage(error.message);
      setBody(trimmedBody);
      window.dispatchEvent(
        new CustomEvent<{ id: string }>("memories:message-failed", {
          detail: { id: optimisticMessage.id },
        })
      );
      setSending(false);
      textareaRef.current?.focus();
      return;
    }

    void supabase
      .from("conversation_members")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId);

    setSending(false);
    textareaRef.current?.focus();
  }

  return (
    <form onSubmit={sendMessage}>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          rows={1}
          placeholder="Message..."
          className="mem-input max-h-32 min-h-11 flex-1 resize-none rounded-[1.35rem] px-4 py-3 text-sm leading-5 outline-none transition focus:border-[var(--app-accent)]"
        />

        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      {message && (
        <p className="mt-2 px-2 text-xs font-medium text-rose-500">
          {message}
        </p>
      )}
    </form>
  );
}
