"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Globe2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { editMomentAction } from "@/app/actions/moments";
import {
  LocationFields,
  type LocationSource,
} from "@/components/create/location-fields";
import { MoodSelector } from "@/components/create/mood-selector";
import { MEMORY_MOODS } from "@/lib/moods";
import type { EditableMoment } from "@/lib/moments/get-editable-moment";

type MomentVisibility = EditableMoment["visibility"];

const visibilityOptions: {
  value: MomentVisibility;
  label: string;
  description: string;
  icon: typeof Globe2;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Visible to people who can view your public profile.",
    icon: Globe2,
  },
  {
    value: "followers",
    label: "Followers",
    description: "Only accepted followers can view.",
    icon: Users,
  },
  {
    value: "inner_circle",
    label: "Inner Circle",
    description: "Only your trusted circle can view.",
    icon: Sparkles,
  },
  {
    value: "private",
    label: "Only me",
    description: "Private Moment visible only to you.",
    icon: LockKeyhole,
  },
];

export function EditMomentScreen({ moment }: { moment: EditableMoment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [caption, setCaption] = useState(moment.caption);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([
    moment.mood || "Peaceful",
  ]);
  const [visibility, setVisibility] = useState<MomentVisibility>(
    moment.visibility
  );
  const [locationName, setLocationName] = useState(moment.locationName);
  const [latitude, setLatitude] = useState<number | null>(moment.latitude);
  const [longitude, setLongitude] = useState<number | null>(moment.longitude);
  const [locationSource, setLocationSource] = useState<LocationSource>(
    moment.locationSource
  );
  const [locationConfidence, setLocationConfidence] = useState<number | null>(
    moment.locationConfidence
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(moment.locationAccuracyMeters);
  const [locationMessage, setLocationMessage] = useState("");
  const [message, setMessage] = useState("");

  function submit() {
    setMessage("");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("momentId", moment.id);
      formData.append("caption", caption.trim());
      formData.append("mood", selectedMoods[0] ?? "");
      formData.append("visibility", visibility);
      formData.append("locationName", locationName);
      formData.append("locationLabel", locationName);
      formData.append("latitude", String(latitude ?? ""));
      formData.append("longitude", String(longitude ?? ""));
      formData.append("locationSource", locationSource);
      formData.append("locationConfidence", String(locationConfidence ?? ""));
      formData.append(
        "locationAccuracyMeters",
        String(locationAccuracyMeters ?? "")
      );

      const result = await editMomentAction(formData);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.push(`/moment/${moment.id}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <Link
          href={`/moment/${moment.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Moment
        </Link>

        <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
          Edit your Moment.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
          Update the caption, feeling, visibility, and location before this Moment expires.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="mem-card rounded-[2rem] p-5 sm:p-6">
          {moment.media && (
            <div className="mb-5 overflow-hidden rounded-[1.8rem] bg-slate-950">
              {moment.media.mediaKind === "image" ? (
                <img
                  src={moment.media.url}
                  alt="Moment preview"
                  className="h-[460px] w-full object-contain"
                />
              ) : (
                <video
                  src={moment.media.url}
                  className="h-[460px] w-full object-contain"
                  controls
                  playsInline
                />
              )}
            </div>
          )}

          <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={280}
            rows={7}
            placeholder="What happened in this moment?"
            className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm leading-7 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"
          />
          <p className="mt-2 text-right text-xs text-[var(--app-muted)]">
            {caption.length}/280
          </p>
        </div>

        <aside className="space-y-5">
          <section className="mem-card rounded-[2rem] p-5">
            <MoodSelector
              moods={MEMORY_MOODS}
              selectedMoods={selectedMoods}
              onChange={setSelectedMoods}
              maxSelections={1}
            />
          </section>

          <LocationFields
            locationName={locationName}
            latitude={latitude}
            longitude={longitude}
            locationSource={locationSource}
            locationConfidence={locationConfidence}
            locationAccuracyMeters={locationAccuracyMeters}
            locationMessage={locationMessage}
            onLocationNameChange={(value) => {
              setLocationName(value);
              if (!latitude || !longitude) {
                setLocationSource(value.trim() ? "manual" : "unknown");
              }
            }}
            onLocationChange={(location) => {
              setLocationName(location.locationName);
              setLatitude(location.latitude);
              setLongitude(location.longitude);
              setLocationSource(location.locationSource);
              setLocationConfidence(location.locationConfidence);
              setLocationAccuracyMeters(location.locationAccuracyMeters);
              setLocationMessage(location.locationMessage);
            }}
          />

          <section className="mem-card rounded-[2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
                <ShieldCheck size={19} />
              </div>
              <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Visibility
              </h2>
            </div>

            <div className="space-y-3">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const active = visibility === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    disabled={isPending}
                    className={
                      active
                        ? "flex w-full items-start gap-3 rounded-2xl border border-[var(--app-accent)] bg-[var(--app-soft)] p-4 text-left"
                        : "flex w-full items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 text-left transition hover:border-[var(--app-accent)]"
                    }
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-muted)]">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--app-text)]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--app-muted)]">
                        {option.description}
                      </span>
                    </span>
                    {active && (
                      <Check size={17} className="text-[var(--app-accent)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {message && (
            <p className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-sm leading-6 text-[var(--app-muted)]">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Updating
              </>
            ) : (
              <>
                Update Moment
                <ChevronRight size={17} />
              </>
            )}
          </button>
        </aside>
      </section>
    </div>
  );
}
