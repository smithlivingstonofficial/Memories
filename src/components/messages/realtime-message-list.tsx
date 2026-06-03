"use client";

import { useEffect, useRef, useState } from "react";
import { markConversationReadAction } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";
import type { MessageThreadItem } from "@/lib/messages/get-messages-data";
import type { OptimisticMessageEvent } from "@/components/messages/message-composer";

type RealtimeMessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type RealtimeReadReceipt = {
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
};

type RealtimeMessageListProps = {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  initialMessages: MessageThreadItem[];
};

export function RealtimeMessageList({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: RealtimeMessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] =
    useState<MessageThreadItem[]>(initialMessages);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMessages(initialMessages);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  useEffect(() => {
    function handleOptimisticMessage(event: Event) {
      const messageEvent = event as CustomEvent<OptimisticMessageEvent>;
      const row = messageEvent.detail;

      if (row.conversationId !== conversationId) return;

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (message) => message.id === row.id
        );

        if (alreadyExists) return currentMessages;

        return [
          ...currentMessages,
          {
            id: row.id,
            body: row.body,
            createdAt: row.createdAt,
            isOwn: true,
            readStatus: "sent",
            sender: {
              id: currentUserId,
              username: "you",
              fullName: "You",
              avatarUrl: null,
            },
          },
        ];
      });
    }

    function handleFailedMessage(event: Event) {
      const failedEvent = event as CustomEvent<{ id: string }>;

      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== failedEvent.detail.id)
      );
    }

    window.addEventListener("memories:message-sent", handleOptimisticMessage);
    window.addEventListener("memories:message-failed", handleFailedMessage);

    return () => {
      window.removeEventListener(
        "memories:message-sent",
        handleOptimisticMessage
      );
      window.removeEventListener(
        "memories:message-failed",
        handleFailedMessage
      );
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribeToConversation() {
      await supabase.realtime.setAuth();

      if (cancelled) return;

      channel = supabase
        .channel(`conversation:${conversationId}`, {
          config: {
            private: true,
          },
        })
        .on("broadcast", { event: "message.created" }, (payload) => {
          const row = payload.payload as RealtimeMessageRow;
          const isOwn = row.senderId === currentUserId;

          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (message) => message.id === row.id
            );

            if (alreadyExists) {
              return currentMessages;
            }

            const nextMessage: MessageThreadItem = {
              id: row.id,
              body: row.body,
              createdAt: row.createdAt,
              isOwn,
              readStatus: isOwn ? "sent" : null,
              sender: isOwn
                ? {
                    id: currentUserId,
                    username: "you",
                    fullName: "You",
                    avatarUrl: null,
                  }
                : otherUser,
            };

            return [...currentMessages, nextMessage];
          });

          if (!isOwn) {
            void markConversationReadAction(conversationId);
          }
        })
        .on("broadcast", { event: "message.read" }, (payload) => {
          const row = payload.payload as RealtimeReadReceipt;

          if (
            row.conversationId !== conversationId ||
            row.userId !== otherUser.id ||
            !row.lastReadAt
          ) {
            return;
          }

          const lastReadTime = new Date(row.lastReadAt).getTime();

          setMessages((currentMessages) =>
            currentMessages.map((message) => {
              if (!message.isOwn) return message;

              const messageTime = new Date(message.createdAt).getTime();

              if (messageTime > lastReadTime) return message;

              return {
                ...message,
                readStatus: "seen",
              };
            })
          );
        })
        .subscribe();
    }

    void subscribeToConversation();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, currentUserId, otherUser]);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-10 text-center">
        <div>
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--app-soft)] font-brand text-xl font-semibold text-[var(--app-accent)]">
            {otherUser.fullName[0] ?? "M"}
          </div>
          <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Start the conversation
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Send a private message to {otherUser.fullName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
        >
          <div
            className={
              message.isOwn
                ? "max-w-[82%] rounded-[1.25rem] rounded-br-md bg-[var(--app-accent)] px-3.5 py-2.5 text-sm leading-6 text-white shadow-[0_12px_32px_rgba(99,102,241,0.22)] sm:max-w-[72%]"
                : "max-w-[82%] rounded-[1.25rem] rounded-bl-md border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3.5 py-2.5 text-sm leading-6 text-[var(--app-text)] sm:max-w-[72%]"
            }
          >
            <p className="whitespace-pre-wrap">{message.body}</p>

            <div
              className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${
                message.isOwn ? "text-white/70" : "text-[var(--app-muted)]"
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>

              {message.isOwn && (
                <span>{message.readStatus === "seen" ? "Seen" : "Sent"}</span>
              )}
            </div>
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
