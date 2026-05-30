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
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-[1000px] flex-col overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_80px_var(--app-shadow)] backdrop-blur-2xl">
      <MarkConversationRead conversationId={data.conversationId} />

      <header className="flex items-center gap-4 border-b border-[var(--app-border)] p-4">
        <Link
          href="/messages"
          className="flex size-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
        >
          <ArrowLeft size={17} />
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
            <h1 className="font-brand truncate text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              {data.otherUser.fullName}
            </h1>
            <p className="truncate text-sm text-[var(--app-muted)]">
              @{data.otherUser.username}
            </p>
          </div>
        </Link>
      </header>

      <main className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        <RealtimeMessageList
          conversationId={data.conversationId}
          currentUserId={currentUserId}
          otherUser={data.otherUser}
          initialMessages={data.messages}
        />
      </main>

      <MessageComposer conversationId={data.conversationId} />
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
        className="size-11 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-brand font-semibold text-[var(--app-accent)]">
      {initials}
    </div>
  );
}