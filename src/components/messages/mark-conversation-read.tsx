"use client";

import { useEffect } from "react";
import { markConversationReadAction } from "@/app/actions/messages";

type MarkConversationReadProps = {
  conversationId: string;
};

export function MarkConversationRead({
  conversationId,
}: MarkConversationReadProps) {
  useEffect(() => {
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  return null;
}