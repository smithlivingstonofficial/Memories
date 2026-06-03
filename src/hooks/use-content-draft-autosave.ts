"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upsertContentDraftAction } from "@/app/actions/drafts";
import type { ContentDraftPayload } from "@/types/draft";

export type AutosaveStatus =
  | "idle"
  | "saved-local"
  | "saving"
  | "saved"
  | "offline"
  | "error";

type UseContentDraftAutosaveOptions = {
  enabled?: boolean;
  userId?: string;
  initialDraftId?: string | null;
  draftType: ContentDraftPayload["draftType"];
  payload: Omit<ContentDraftPayload, "id" | "draftType">;
  hasMeaningfulContent: boolean;
  debounceMs?: number;
};

export function useContentDraftAutosave({
  enabled = true,
  userId,
  initialDraftId,
  draftType,
  payload,
  hasMeaningfulContent,
  debounceMs = 1500,
}: UseContentDraftAutosaveOptions) {
  const [draftId, setDraftId] = useState<string | null>(initialDraftId ?? null);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const payloadRef = useRef(payload);
  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  const localStorageKey = useMemo(() => {
    if (!userId) return null;
    return `memories.contentDraft.v1.${userId}.${draftType}`;
  }, [draftType, userId]);

  const syncNow = useCallback(async () => {
    if (!enabled || !userId || !hasMeaningfulContent) return;
    if (syncInFlightRef.current) return;

    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    syncInFlightRef.current = true;
    setStatus("saving");

    const result = await upsertContentDraftAction({
      ...payloadRef.current,
      id: draftIdRef.current ?? undefined,
      draftType,
    });

    syncInFlightRef.current = false;

    if (!result.success) {
      setStatus("error");
      return;
    }

    if (result.draftId) {
      setDraftId(result.draftId);
    }

    setSavedAt(result.savedAt ?? new Date().toISOString());
    setStatus("saved");
  }, [draftType, enabled, hasMeaningfulContent, userId]);

  useEffect(() => {
    if (!enabled || !localStorageKey) return;

    if (!hasMeaningfulContent) {
      localStorage.removeItem(localStorageKey);
      const resetTimeoutId = window.setTimeout(() => {
        setStatus("idle");
      }, 0);

      return () => {
        window.clearTimeout(resetTimeoutId);
      };
    }

    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        ...payload,
        id: draftId ?? undefined,
        draftType,
        updatedAt: new Date().toISOString(),
      })
    );
    const statusTimeoutId = window.setTimeout(() => {
      setStatus((current) => (current === "saving" ? current : "saved-local"));
    }, 0);

    const timeoutId = window.setTimeout(() => {
      void syncNow();
    }, debounceMs);

    return () => {
      window.clearTimeout(statusTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [
    debounceMs,
    draftId,
    draftType,
    enabled,
    hasMeaningfulContent,
    localStorageKey,
    payload,
    syncNow,
  ]);

  useEffect(() => {
    if (!enabled) return;

    function handlePageHide() {
      void syncNow();
    }

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("blur", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("blur", handlePageHide);
    };
  }, [enabled, syncNow]);

  const clearLocalDraft = useCallback(() => {
    if (localStorageKey) {
      localStorage.removeItem(localStorageKey);
    }
    setStatus("idle");
  }, [localStorageKey]);

  return {
    draftId,
    status,
    savedAt,
    syncNow,
    clearLocalDraft,
  };
}

export function formatAutosaveStatus(status: AutosaveStatus, savedAt: string | null) {
  if (status === "saving") return "Saving...";
  if (status === "saved-local") return "Saved locally";
  if (status === "offline") return "Offline";
  if (status === "error") return "Sync failed";
  if (status === "saved") {
    if (!savedAt) return "Saved";

    return `Saved ${new Date(savedAt).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return "";
}
