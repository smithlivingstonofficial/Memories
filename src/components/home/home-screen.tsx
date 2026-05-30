import Link from "next/link";
import {
  Bookmark,
  Heart,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import type { FeedMemory } from "@/types/memory";

const moments = [
  "You",
  "Inner Circle",
  "Friends",
  "Family",
  "Travel",
  "Vault",
  "Peaceful",
];

type HomeScreenProps = {
  memories: FeedMemory[];
  currentUserId: string;
};

export function HomeScreen({ memories, currentUserId }: HomeScreenProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <section className="mem-card rounded-[2rem] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Moments
              </h2>
              <p className="text-sm leading-6 text-[var(--app-muted)]">
                Soft updates from people and memories you care about.
              </p>
            </div>

            <Link
              href="/create"
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-white shadow-[0_18px_40px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)]"
            >
              <Plus size={19} />
            </Link>
          </div>

          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {moments.map((moment, index) => (
              <div key={moment} className="shrink-0 text-center">
                <div className="rounded-full bg-gradient-to-br from-[#6366F1] via-[#A5B4FC] to-[#FFE4E6] p-[2px]">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[var(--app-surface-strong)] font-semibold text-[var(--app-text)]">
                    {index === 0 ? <Plus size={20} /> : moment[0]}
                  </div>
                </div>
                <p className="mt-2 max-w-16 truncate text-xs text-[var(--app-muted)]">
                  {moment}
                </p>
              </div>
            ))}
          </div>
        </section>

        {memories.length === 0 ? (
          <EmptyFeed />
        ) : (
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                canDelete={memory.author.id === currentUserId}
              />
            ))}
          </section>
        )}
      </div>

      <aside className="hidden space-y-5 xl:block">
        <div className="mem-card rounded-[2rem] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-surface-strong)] text-[var(--app-accent)]">
              <LockKeyhole size={18} />
            </div>

            <div>
              <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Vault
              </h3>
              <p className="text-xs text-[var(--app-muted)]">
                Your private world
              </p>
            </div>
          </div>

          <p className="text-sm leading-6 text-[var(--app-muted)]">
            Write private memories visible only to you. No likes. No public
            pressure.
          </p>

          <Link
            href="/create/vault"
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-heading)] text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
          >
            Write in Vault
            <Sparkles size={16} />
          </Link>
        </div>

        <div className="mem-card rounded-[2rem] p-5">
          <h3 className="font-brand text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Today’s reflection
          </h3>

          <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
            What is one small moment from today that you want to remember?
          </p>

          <div className="mt-5 rounded-[1.4rem] bg-[var(--app-soft)] p-4 text-sm leading-6 text-[var(--app-accent)]">
            “Small moments become meaningful when we pause to keep them.”
          </div>
        </div>
      </aside>
    </div>
  );
}

function MemoryCard({
  memory,
  canDelete,
}: {
  memory: FeedMemory;
  canDelete: boolean;
}) {
  const firstMedia = memory.media[0];

  return (
    <article className="mem-card overflow-hidden rounded-[2rem]">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/u/${memory.author.username}`}
            className="flex min-w-0 items-center gap-3"
          >
            <AuthorAvatar memory={memory} />

            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
                {memory.author.fullName}
                </p>
                <p className="truncate text-xs text-[var(--app-muted)]">
                @{memory.author.username} • {formatDate(memory.createdAt)}
                </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {canDelete && (
              <DeleteMemoryButton memoryId={memory.id} type="memory" />
            )}

            <button className="text-[var(--app-muted)] transition hover:text-[var(--app-text)]">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>

        {firstMedia ? (
          <div className="mb-4 overflow-hidden rounded-[1.6rem] bg-[var(--app-surface-soft)]">
            {firstMedia.mediaKind === "image" ? (
              <img
                src={firstMedia.url}
                alt={memory.title ?? "Memory media"}
                className="h-[280px] w-full object-cover sm:h-[330px] lg:h-[300px] xl:h-[320px]"
              />
            ) : firstMedia.mediaKind === "video" ? (
              <video
                src={firstMedia.url}
                className="h-[280px] w-full object-cover sm:h-[330px] lg:h-[300px] xl:h-[320px]"
                controls
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center bg-[var(--app-soft)] text-[var(--app-accent)]">
                <ImagePlus />
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 flex h-[280px] items-center justify-center rounded-[1.6rem] [background:var(--vault-hero)] sm:h-[330px] lg:h-[300px] xl:h-[320px]">
            <ImagePlus className="text-[var(--app-accent)]" />
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {memory.moods.map((mood) => (
            <span
              key={mood}
              className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]"
            >
              {mood}
            </span>
          ))}

          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
            {formatPrivacy(memory.privacy)}
          </span>
        </div>

        {memory.title && (
          <h3 className="font-brand mb-2 text-lg font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            {memory.title}
          </h3>
        )}

        <p className="text-[15px] leading-7 text-[var(--app-muted)]">
          {memory.content}
        </p>

        {memory.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4">
          <div className="flex items-center gap-4 text-[var(--app-muted)]">
            <button className="flex items-center gap-2 transition hover:text-rose-500">
              <Heart size={18} />
              <span className="text-xs font-medium">Like</span>
            </button>

            <button className="flex items-center gap-2 transition hover:text-[var(--app-accent)]">
              <MessageCircle size={18} />
              <span className="text-xs font-medium">Reflect</span>
            </button>
          </div>

          <button className="text-[var(--app-muted)] transition hover:text-[var(--app-accent)]">
            <Bookmark size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthorAvatar({ memory }: { memory: FeedMemory }) {
  if (memory.author.avatarUrl) {
    return (
      <img
        src={memory.author.avatarUrl}
        alt={memory.author.fullName}
        className="size-11 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]">
      {memory.author.fullName[0] ?? "M"}
    </div>
  );
}

function EmptyFeed() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No memories yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        Create your first memory with words, mood, privacy, and media. It will
        appear here after saving.
      </p>

      <Link
        href="/create/memory"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
      >
        Write your first Memory
      </Link>
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

function formatPrivacy(value: FeedMemory["privacy"]) {
  const labels = {
    private: "Private",
    inner_circle: "Inner Circle",
    friends: "Friends",
    public: "Public",
    vault: "Vault",
  };

  return labels[value];
}