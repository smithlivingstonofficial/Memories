"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { respondFollowRequestAction } from "@/app/actions/follows";

type FollowRequestControlsProps = {
  followerId: string;
};

export function FollowRequestControls({
  followerId,
}: FollowRequestControlsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function respond(response: "accept" | "decline") {
    setMessage("");

    startTransition(async () => {
      const result = await respondFollowRequestAction({
        followerId,
        response,
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => respond("accept")}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Accept
        </button>

        <button
          type="button"
          onClick={() => respond("decline")}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/15 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <X size={16} />
          )}
          Decline
        </button>
      </div>

      {message && <p className="text-xs font-medium text-rose-500">{message}</p>}
    </div>
  );
}