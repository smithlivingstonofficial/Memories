"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, MessageCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  ConversationListItem,
  MessagesInboxData,
} from "@/lib/messages/get-messages-data";
import { cn } from "@/lib/utils";

type MessagesScreenProps = {
  data: MessagesInboxData;
  currentUserId: string;
};

type RealtimeMessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export function MessagesScreen({ data, currentUserId }: MessagesScreenProps) {
  const [conversations, setConversations] = useState(data.conversations);
  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
      ),
    [conversations]
  );

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribeToInbox() {
      await supabase.realtime.setAuth();

      if (cancelled) return;

      channel = supabase
        .channel(`user-messages:${currentUserId}`, {
          config: {
            private: true,
          },
        })
        .on("broadcast", { event: "message.created" }, (payload) => {
          const row = payload.payload as RealtimeMessageRow;

          setConversations((current) => {
            const index = current.findIndex(
              (conversation) => conversation.id === row.conversationId
            );

            if (index === -1) {
              return current;
            }

            const isOwn = row.senderId === currentUserId;
            const nextConversation: ConversationListItem = {
              ...current[index],
              updatedAt: row.createdAt,
              unreadCount: isOwn
                ? current[index].unreadCount
                : current[index].unreadCount + 1,
              lastMessage: {
                body: row.body,
                createdAt: row.createdAt,
                isOwn,
              },
            };

            return [
              nextConversation,
              ...current.filter(
                (conversation) => conversation.id !== row.conversationId
              ),
            ];
          });
        })
        .subscribe();
    }

    void subscribeToInbox();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserId]);

  return (
    <div className="-mx-3 flex min-h-[calc(100dvh-6.5rem)] w-[calc(100%+1.5rem)] max-w-[1400px] flex-col gap-3 sm:mx-auto sm:w-full lg:min-h-[calc(100dvh-8rem)]">
      <section className="mem-card flex min-h-0 flex-1 overflow-hidden rounded-[1.35rem] sm:rounded-[2rem]">
        <aside className="flex min-h-0 w-full flex-col border-[var(--app-border)] lg:w-[420px] lg:border-r xl:w-[460px]">
          <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
                  <MessageCircle size={14} />
                  Inbox
                </p>
                <h1 className="mt-2 font-brand text-3xl font-semibold leading-tight text-[var(--app-text)] sm:text-4xl lg:text-3xl">
                  Messages
                </h1>
              </div>

              {totalUnread > 0 && (
                <span className="rounded-full bg-[var(--app-accent)] px-3 py-1 text-xs font-semibold text-white">
                  {totalUnread} unread
                </span>
              )}
            </div>

            <div className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 text-[var(--app-muted)]">
              <Search size={17} />
              <span className="text-sm">Search conversations</span>
            </div>
          </header>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <EmptyMessages />
            ) : (
              <div className="divide-y divide-[var(--app-border)]">
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="hidden min-w-0 flex-1 flex-col items-center justify-center p-8 text-center lg:flex">
          <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
            <MessageCircle size={28} />
          </div>
          <h2 className="mt-5 font-brand text-3xl font-semibold text-[var(--app-text)]">
            Your conversations
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
            Open a chat to continue privately. New messages update here without
            reloading the page.
          </p>
        </section>
      </section>
    </div>
  );
}

function ConversationRow({
  conversation,
}: {
  conversation: ConversationListItem;
}) {
  const unread = conversation.unreadCount > 0;

  return (
    <Link
      href={`/messages/${conversation.otherUser.username}`}
      className={cn(
        "flex gap-3 px-4 py-3 transition hover:bg-[var(--app-surface-strong)] sm:px-5 sm:py-4",
        unread && "bg-[var(--app-soft)]/55"
      )}
    >
      <Avatar
        fullName={conversation.otherUser.fullName}
        avatarUrl={conversation.otherUser.avatarUrl}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-[var(--app-text)]">
              {conversation.otherUser.fullName}
            </h2>
            <p className="truncate text-xs text-[var(--app-muted)]">
              @{conversation.otherUser.username}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium text-[var(--app-faint)]">
              {formatConversationTime(
                conversation.lastMessage?.createdAt ?? conversation.updatedAt
              )}
            </p>
            {unread && (
              <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--app-accent)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>

        <p
          className={cn(
            "mt-1 truncate text-sm",
            unread
              ? "font-semibold text-[var(--app-text)]"
              : "text-[var(--app-muted)]"
          )}
        >
          {conversation.lastMessage
            ? `${conversation.lastMessage.isOwn ? "You: " : ""}${
                conversation.lastMessage.body
              }`
            : "No messages yet."}
        </p>
      </div>
    </Link>
  );
}

function Avatar({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="size-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="flex min-h-full items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
          <ImagePlus size={24} />
        </div>

        <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          No conversations yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
          Visit a profile and tap Message to start a private conversation.
        </p>
      </div>
    </div>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
