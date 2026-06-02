"use client";

import { useMemo, useState } from "react";
import {
  MAX_MOOD_SELECTION,
  MEMORY_MOOD_CATEGORIES,
  VAULT_MOOD_CATEGORIES,
} from "@/lib/moods";
import { cn } from "@/lib/utils";

type MoodSelectorProps = {
  moods: string[];
  selectedMoods: string[];
  onChange: (moods: string[]) => void;
};

export function MoodSelector({
  moods,
  selectedMoods,
  onChange,
}: MoodSelectorProps) {
  const categories = useMemo(() => {
    const source =
      moods.length < 24 ? VAULT_MOOD_CATEGORIES : MEMORY_MOOD_CATEGORIES;
    const allowed = new Set(moods);

    return source
      .map((group) => ({
        category: group.category,
        moods: group.moods.filter((mood) => allowed.has(mood)),
      }))
      .filter((group) => group.moods.length > 0);
  }, [moods]);
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.category ?? "Happy"
  );
  const activeGroup =
    categories.find((group) => group.category === activeCategory) ??
    categories[0];

  function toggleMood(mood: string) {
    const alreadySelected = selectedMoods.includes(mood);

    if (alreadySelected) {
      if (selectedMoods.length === 1) return;

      onChange(selectedMoods.filter((item) => item !== mood));
      return;
    }

    if (selectedMoods.length >= MAX_MOOD_SELECTION) return;

    onChange([...selectedMoods, mood]);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-[var(--app-text)]">
          Mood
        </label>

        <span className="text-xs font-medium text-[var(--app-muted)]">
          {selectedMoods.length}/{MAX_MOOD_SELECTION}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map((group) => (
          <button
            key={group.category}
            type="button"
            onClick={() => setActiveCategory(group.category)}
            className={cn(
              "rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition-all",
              activeGroup?.category === group.category
                ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
          >
            {group.category}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(activeGroup?.moods ?? moods).map((mood) => {
          const active = selectedMoods.includes(mood);

          return (
            <button
              key={mood}
              type="button"
              onClick={() => toggleMood(mood)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                active
                  ? "bg-[var(--app-accent)] text-white shadow-[0_12px_26px_rgba(99,102,241,0.25)]"
                  : "border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              {mood}
            </button>
          );
        })}
      </div>

      {selectedMoods.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--app-border)] pt-3">
          {selectedMoods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => toggleMood(mood)}
              className="rounded-full bg-[var(--app-accent)] px-3 py-1 text-xs font-semibold text-white"
            >
              {mood} x
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
        Choose a major feeling, then select up to {MAX_MOOD_SELECTION} sub-feelings.
      </p>
    </div>
  );
}
