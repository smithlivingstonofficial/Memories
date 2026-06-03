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
    <div className="-mx-3 flex h-[calc(100dvh-6.5rem)] w-[calc(100%+1.5rem)] max-w-[1120px] flex-col overflow-hidden rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl sm:mx-auto sm:h-[calc(100dvh-8rem)] sm:w-full sm:rounded-[2rem]">
      <MarkConversationRead conversationId={data.conversationId} />

      <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface-strong)]/90 px-3 py-2.5 backdrop-blur-2xl sm:px-5 sm:py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] transition hover:text-[var(--app-text)] sm:size-11 sm:rounded-2xl"
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
              <h1 className="truncate text-base font-semibold text-[var(--app-text)] sm:font-brand sm:text-xl sm:tracking-[-0.04em]">
                {data.otherUser.fullName}
              </h1>

              <p className="truncate text-xs text-[var(--app-muted)] sm:text-sm">
                @{data.otherUser.username}
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.09),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.12),transparent_30%)] px-3 py-4 sm:p-5">
        <RealtimeMessageList
          conversationId={data.conversationId}
          currentUserId={currentUserId}
          otherUser={data.otherUser}
          initialMessages={data.messages}
        />
      </main>

      <footer className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface-strong)]/90 p-2.5 backdrop-blur-2xl sm:p-3">
        <MessageComposer
          conversationId={data.conversationId}
          currentUserId={currentUserId}
        />
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
        className="size-10 shrink-0 rounded-full object-cover sm:size-12"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)] sm:size-12">
      {initials}
    </div>
  );
}
