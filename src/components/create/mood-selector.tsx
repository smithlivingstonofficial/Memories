"use client";

import { MAX_MOOD_SELECTION } from "@/lib/moods";
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

      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => {
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

      <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
        Select up to {MAX_MOOD_SELECTION} moods that match this memory.
      </p>
    </div>
  );
}