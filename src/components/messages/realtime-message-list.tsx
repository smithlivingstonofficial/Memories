"use client";

import { useEffect, useRef, useState } from "react";
import { markConversationReadAction } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";
import type { MessageThreadItem } from "@/lib/messages/get-messages-data";

type RealtimeMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type RealtimeMemberRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
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
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeMessageRow;
          const isOwn = row.sender_id === currentUserId;

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
              createdAt: row.created_at,
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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeMemberRow;

          if (row.user_id !== otherUser.id || !row.last_read_at) return;

          const lastReadTime = new Date(row.last_read_at).getTime();

          setMessages((currentMessages) =>
            currentMessages.map((message) => {
              if (!message.isOwn) return message;

              const messageTime = new Date(message.createdAt).getTime();

              if (messageTime <= lastReadTime) {
                return {
                  ...message,
                  readStatus: "seen",
                };
              }

              return message;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, otherUser]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Start the conversation
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Send a private message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
        >
          <div
            className={
              message.isOwn
                ? "max-w-[78%] rounded-[1.4rem] bg-[var(--app-accent)] px-4 py-3 text-sm leading-6 text-white shadow-[0_12px_32px_rgba(99,102,241,0.22)]"
                : "max-w-[78%] rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--app-text)]"
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
    </>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}