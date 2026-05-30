"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Clock, Loader2, UserMinus, UserPlus, X } from "lucide-react";
import {
  cancelFollowAction,
  followUserAction,
  unfollowUserAction,
} from "@/app/actions/follows";

type FollowStatus = "self" | "not_following" | "requested" | "following";

type FollowProfileButtonProps = {
  targetUserId: string;
  status: FollowStatus;
  accountVisibility: "public" | "private";
};

export function FollowProfileButton({
  targetUserId,
  status,
  accountVisibility,
}: FollowProfileButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (status === "self") {
    return null;
  }

  function runAction() {
    setMessage("");

    startTransition(async () => {
      const result =
        status === "not_following"
          ? await followUserAction(targetUserId)
          : status === "requested"
            ? await cancelFollowAction(targetUserId)
            : await unfollowUserAction(targetUserId);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  const label =
    status === "not_following"
      ? accountVisibility === "private"
        ? "Request follow"
        : "Follow"
      : status === "requested"
        ? "Requested"
        : "Following";

  const Icon =
    status === "not_following"
      ? UserPlus
      : status === "requested"
        ? Clock
        : Check;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={runAction}
        disabled={isPending}
        className={
          status === "following"
            ? "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-rose-500 disabled:opacity-60"
            : status === "requested"
              ? "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-rose-500 disabled:opacity-60"
              : "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
        }
      >
        {isPending ? (
          <Loader2 size={17} className="animate-spin" />
        ) : status === "requested" ? (
          <X size={17} />
        ) : status === "following" ? (
          <UserMinus size={17} />
        ) : (
          <Icon size={17} />
        )}

        {isPending
          ? "Updating..."
          : status === "requested"
            ? "Cancel request"
            : status === "following"
              ? "Unfollow"
              : label}
      </button>

      {message && (
        <p className="text-xs font-medium text-rose-500">{message}</p>
      )}
    </div>
  );
}