"use client";

import { useState, useTransition } from "react";
import { Check, Clock, UserMinus, UserPlus, X } from "lucide-react";
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
  const [currentStatus, setCurrentStatus] = useState(status);
  const [message, setMessage] = useState("");
  const [actionPulse, setActionPulse] = useState(0);
  const [isPending, startTransition] = useTransition();

  if (currentStatus === "self") {
    return null;
  }

  const nextStatus =
    currentStatus === "not_following"
      ? accountVisibility === "private"
        ? "requested"
        : "following"
      : "not_following";

  function runAction() {
    if (isPending) return;

    setMessage("");
    setActionPulse((current) => current + 1);

    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);

    startTransition(async () => {
      const result =
        previousStatus === "not_following"
          ? await followUserAction(targetUserId)
          : previousStatus === "requested"
            ? await cancelFollowAction(targetUserId)
            : await unfollowUserAction(targetUserId);

      if (!result.success) {
        setCurrentStatus(previousStatus);
        setMessage(result.message);
        return;
      }
    });
  }

  const label =
    currentStatus === "not_following"
      ? accountVisibility === "private"
        ? "Request follow"
        : "Follow"
      : currentStatus === "requested"
        ? "Requested"
        : "Following";

  const Icon =
    currentStatus === "not_following"
      ? UserPlus
      : currentStatus === "requested"
        ? Clock
        : Check;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={runAction}
        disabled={isPending}
        className={
          currentStatus === "following"
            ? "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-emerald-500 transition hover:text-rose-500 disabled:opacity-80"
            : currentStatus === "requested"
              ? "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 text-sm font-semibold text-[var(--app-muted)] transition hover:text-rose-500 disabled:opacity-80"
              : "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.25)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-80"
        }
      >
        <span
          key={actionPulse}
          className="pointer-events-none absolute inset-0 bg-white/20 animate-[action-sheen_620ms_ease-out_1]"
        />

        <span
          key={`${currentStatus}-${actionPulse}`}
          className="relative grid size-5 place-items-center animate-[button-pop_360ms_cubic-bezier(0.2,0.8,0.2,1)_1]"
        >
          {currentStatus === "requested" ? (
            <X size={17} />
          ) : currentStatus === "following" ? (
            <UserMinus size={17} />
          ) : (
            <Icon size={17} />
          )}
        </span>

        <span className="relative">
          {currentStatus === "requested"
            ? "Cancel request"
            : currentStatus === "following"
              ? "Unfollow"
              : label}
        </span>
      </button>

      {message && (
        <p className="text-xs font-medium text-rose-500">{message}</p>
      )}
    </div>
  );
}
