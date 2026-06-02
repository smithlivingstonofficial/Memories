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
  "Angry",
  "Frustrated",
  "Hurt",
  "Restless",
  "Overwhelmed",
  "Worried",
  "Connected",
  "Drained",
  "Slow",
];

export const MEMORY_MOOD_CATEGORIES = [
  {
    category: "Happy",
    moods: ["Happy", "Joyful", "Content", "Proud", "Blessed", "Surprised"],
  },
  {
    category: "Sad",
    moods: ["Sad", "Lonely", "Emotional", "Healing", "Nostalgic"],
  },
  {
    category: "Calm",
    moods: ["Calm", "Peaceful", "Relaxed", "Quiet", "Dreamy"],
  },
  {
    category: "Angry",
    moods: ["Angry", "Frustrated", "Hurt", "Restless"],
  },
  {
    category: "Anxious",
    moods: ["Anxious", "Confused", "Overwhelmed", "Worried"],
  },
  {
    category: "Loved",
    moods: ["Loved", "Thankful", "Grateful", "Connected"],
  },
  {
    category: "Grateful",
    moods: ["Grateful", "Thankful", "Blessed", "Hopeful"],
  },
  {
    category: "Tired",
    moods: ["Tired", "Drained", "Quiet", "Slow"],
  },
  {
    category: "Excited",
    moods: ["Excited", "Inspired", "Motivated", "Brave", "Focused"],
  },
  {
    category: "Reflective",
    moods: ["Reflective", "Thoughtful", "Nostalgic", "Hopeful", "Healing"],
  },
] as const;

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

export const VAULT_MOOD_CATEGORIES = MEMORY_MOOD_CATEGORIES.map((group) => ({
  ...group,
  moods: group.moods.filter((mood) => VAULT_MOODS.includes(mood)),
})).filter((group) => group.moods.length > 0);

export const MAX_MOOD_SELECTION = 5;

export function normalizeMoods(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_MOOD_SELECTION);
}
