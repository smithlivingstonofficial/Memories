import Link from "next/link";
import { ImagePlus, MessageCircle } from "lucide-react";
import { MessagesRealtimeRefresh } from "@/components/messages/messages-realtime-refresh";
import type { MessagesInboxData } from "@/lib/messages/get-messages-data";

type MessagesScreenProps = {
  data: MessagesInboxData;
};

export function MessagesScreen({ data }: MessagesScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5">
      <MessagesRealtimeRefresh />

      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <MessageCircle size={14} />
          Messages
        </p>

        <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
          Private conversations
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
          Unread messages are highlighted here. Conversations update when new
          messages arrive.
        </p>
      </section>

      {data.conversations.length === 0 ? (
        <EmptyMessages />
      ) : (
        <section className="space-y-4">
          {data.conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.otherUser.username}`}
              className={
                conversation.unreadCount > 0
                  ? "mem-card block rounded-[2rem] border-[var(--app-accent)] p-4 transition hover:border-[var(--app-accent)]"
                  : "mem-card block rounded-[2rem] p-4 transition hover:border-[var(--app-accent)]"
              }
            >
              <div className="flex items-center gap-4">
                <Avatar
                  fullName={conversation.otherUser.fullName}
                  avatarUrl={conversation.otherUser.avatarUrl}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                        {conversation.otherUser.fullName}
                      </h2>

                      <p className="truncate text-sm text-[var(--app-muted)]">
                        @{conversation.otherUser.username}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[var(--app-faint)]">
                        {formatDate(conversation.updatedAt)}
                      </p>

                      {conversation.unreadCount > 0 && (
                        <span className="mt-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--app-accent)] px-2 py-1 text-xs font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={
                      conversation.unreadCount > 0
                        ? "mt-2 truncate text-sm font-semibold text-[var(--app-text)]"
                        : "mt-2 truncate text-sm text-[var(--app-muted)]"
                    }
                  >
                    {conversation.lastMessage
                      ? `${conversation.lastMessage.isOwn ? "You: " : ""}${
                          conversation.lastMessage.body
                        }`
                      : "No messages yet."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
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
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="size-14 shrink-0 rounded-[1.3rem] object-cover"
      />
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.3rem] bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}

function EmptyMessages() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No conversations yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Visit someone’s profile and tap Message to start a private conversation.
      </p>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}