import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkConversationRead } from "@/components/messages/mark-conversation-read";
import { MessageComposer } from "@/components/messages/message-composer";
import { RealtimeMessageList } from "@/components/messages/realtime-message-list";
import type { MessageThreadData } from "@/lib/messages/get-messages-data";

type MessageThreadScreenProps = {
  data: MessageThreadData;
  currentUserId: string;
};

export function MessageThreadScreen({
  data,
  currentUserId,
}: MessageThreadScreenProps) {
  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-[1040px] flex-col overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl">
      <MarkConversationRead conversationId={data.conversationId} />

      <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface-strong)]/85 px-4 py-3 backdrop-blur-2xl sm:px-5">
        <div className="flex items-center gap-4">
          <Link
            href="/messages"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            aria-label="Back to messages"
          >
            <ArrowLeft size={18} />
          </Link>

          <Link
            href={`/u/${data.otherUser.username}`}
            className="flex min-w-0 items-center gap-3"
          >
            <Avatar
              fullName={data.otherUser.fullName}
              avatarUrl={data.otherUser.avatarUrl}
            />

            <div className="min-w-0">
              <h1 className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-xl">
                {data.otherUser.fullName}
              </h1>

              <p className="truncate text-sm text-[var(--app-muted)]">
                @{data.otherUser.username}
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.09),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.12),transparent_30%)] p-4 sm:p-5">
        {data.messages.length === 0 ? (
          <EmptyChat otherUserName={data.otherUser.fullName} />
        ) : (
          <RealtimeMessageList
            conversationId={data.conversationId}
            currentUserId={currentUserId}
            otherUser={data.otherUser}
            initialMessages={data.messages}
          />
        )}
      </main>

      <footer className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface-strong)]/90 p-3 backdrop-blur-2xl sm:p-4">
        <MessageComposer conversationId={data.conversationId} />
      </footer>
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
        className="size-12 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}

function EmptyChat({ otherUserName }: { otherUserName: string }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="max-w-sm rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 text-center shadow-[0_20px_70px_var(--app-shadow)]">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] font-brand text-xl font-semibold text-[var(--app-accent)]">
          {otherUserName[0] ?? "M"}
        </div>

        <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          Start chatting
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
          Send your first message to {otherUserName}.
        </p>
      </div>
    </div>
  );
}