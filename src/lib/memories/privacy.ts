import type { FeedMemory } from "@/types/memory";

export type MemoryPrivacy = FeedMemory["privacy"];

export const MEMORY_PRIVACY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Everyone with the Memories Account can see",
  },
  {
    value: "followers",
    label: "Followers",
    description: "Those who follows me can see that memory",
  },
  {
    value: "inner_circle",
    label: "Inner Circle",
    description:
      "Those who i selected them as a inner circle from my followers can see",
  },
  {
    value: "private",
    label: "Private",
    description: "Only Me can see from my account",
  },
  {
    value: "vault",
    label: "Vault",
    description:
      "Only Me can see like private but need a password pin to unlock",
  },
] as const satisfies ReadonlyArray<{
  value: MemoryPrivacy;
  label: string;
  description: string;
}>;

export function formatMemoryPrivacy(value: MemoryPrivacy) {
  return (
    MEMORY_PRIVACY_OPTIONS.find((option) => option.value === value)?.label ??
    "Private"
  );
}
