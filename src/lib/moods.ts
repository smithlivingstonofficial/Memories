export const MEMORY_MOODS = [
  "Peaceful",
  "Happy",
  "Grateful",
  "Calm",
  "Hopeful",
  "Blessed",
  "Loved",
  "Thoughtful",
  "Excited",
  "Inspired",
  "Nostalgic",
  "Proud",
  "Relaxed",
  "Joyful",
  "Thankful",
  "Focused",
  "Dreamy",
  "Emotional",
  "Quiet",
  "Brave",
  "Tired",
  "Sad",
  "Lonely",
  "Confused",
  "Anxious",
  "Healing",
  "Reflective",
  "Motivated",
  "Surprised",
  "Content",
];

export const VAULT_MOODS = [
  "Thoughtful",
  "Calm",
  "Peaceful",
  "Grateful",
  "Hopeful",
  "Loved",
  "Blessed",
  "Quiet",
  "Sad",
  "Lonely",
  "Anxious",
  "Healing",
  "Reflective",
  "Emotional",
  "Tired",
  "Confused",
  "Brave",
  "Content",
];

export const MAX_MOOD_SELECTION = 5;

export function normalizeMoods(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_MOOD_SELECTION);
}