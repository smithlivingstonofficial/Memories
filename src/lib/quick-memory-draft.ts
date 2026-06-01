export type QuickMemoryDraft = {
  title: string;
  content: string;
  updatedAt: string;
};

export const QUICK_MEMORY_DRAFT_PREFIX = "memories.quickMemoryDraft.v1";
export const QUICK_MEMORY_CLEAR_FLAG = "memories.quickMemoryDraft.clearAfterNavigation";

export function getQuickMemoryDraftKey(userId: string) {
  return `${QUICK_MEMORY_DRAFT_PREFIX}.${userId}`;
}
