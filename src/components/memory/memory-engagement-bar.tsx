"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Heart, Loader2, MessageCircle, Send } from "lucide-react";
import {
  createReflectionAction,
  toggleMemoryLikeAction,
  type CreateReflectionState,
} from "@/app/actions/engagements";

type MemoryEngagementBarProps = {
  memoryId: string;
  initialLikeCount: number;
  initialReflectionCount: number;
  initiallyLiked: boolean;
  canEngage: boolean;
};

const initialReflectionState: CreateReflectionState = {
  success: false,
  message: "",
};

export function MemoryEngagementBar({
  memoryId,
  initialLikeCount,
  initialReflectionCount,
  initiallyLiked,
  canEngage,
}: MemoryEngagementBarProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [reflectionCount, setReflectionCount] = useState(
    initialReflectionCount
  );
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [likeBurst, setLikeBurst] = useState(0);
  const [isLikePending, startLikeTransition] = useTransition();

  const [reflectionState, reflectionAction, reflectionPending] = useActionState(
    createReflectionAction,
    initialReflectionState
  );

  function toggleLike() {
    if (!canEngage || isLikePending) return;

    setLikeMessage("");
    setLikeBurst((current) => current + 1);

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikeCount(Math.max(0, previousLikeCount + (nextLiked ? 1 : -1)));

    startLikeTransition(async () => {
      const result = await toggleMemoryLikeAction(memoryId);

      if (!result.success) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        setLikeMessage(result.message);
        return;
      }

      setLiked(Boolean(result.liked));
      setLikeCount(result.likeCount ?? 0);
    });
  }

  useEffect(() => {
    if (reflectionState.success && reflectionState.reflectionId) {
      const timeoutId = window.setTimeout(() => {
        setReflectionCount((current) => current + 1);
        formRef.current?.reset();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [reflectionState.success, reflectionState.reflectionId]);

  return (
    <div className="mt-5 border-t border-[var(--app-border)] pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[var(--app-muted)]">
          <button
            type="button"
            onClick={toggleLike}
            disabled={!canEngage || isLikePending}
            className={`group relative flex items-center gap-2 transition disabled:opacity-70 ${
              liked ? "text-rose-500" : "hover:text-rose-500"
            }`}
          >
            {liked && (
              <span
                key={likeBurst}
                className="pointer-events-none absolute -left-1 top-1/2 size-7 -translate-y-1/2 rounded-full bg-rose-500/20 animate-[ping_600ms_ease-out_1]"
              />
            )}

            <span
              key={`${liked}-${likeBurst}`}
              className={`relative grid size-5 place-items-center transition-transform ${
                liked
                  ? "animate-[heart-pop_420ms_cubic-bezier(0.2,0.8,0.2,1)_1]"
                  : "group-active:scale-90"
              }`}
            >
              <Heart
                size={18}
                fill={liked ? "currentColor" : "none"}
                className="transition-transform"
              />
            </span>

            <span className="text-xs font-medium">
              {likeCount > 0 ? likeCount : "Like"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setReflectionOpen((current) => !current)}
            disabled={!canEngage}
            className="flex items-center gap-2 transition hover:text-[var(--app-accent)] disabled:opacity-50"
          >
            <MessageCircle size={18} />

            <span className="text-xs font-medium">
              {reflectionCount > 0 ? reflectionCount : "Reflect"}
            </span>
          </button>
        </div>
      </div>

      {likeMessage && (
        <p className="mt-3 text-xs font-medium text-rose-500">{likeMessage}</p>
      )}

      {reflectionOpen && (
        <form ref={formRef} action={reflectionAction} className="mt-4 space-y-3">
          <input type="hidden" name="memoryId" value={memoryId} />

          <textarea
            name="content"
            rows={3}
            placeholder="Write a reflection..."
            className="mem-input w-full resize-none rounded-[1.3rem] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--app-accent)]"
          />

          {reflectionState.message && (
            <p
              className={`text-xs font-medium ${
                reflectionState.success ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {reflectionState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={reflectionPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
          >
            {reflectionPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Send Reflection
          </button>
        </form>
      )}
    </div>
  );
}
