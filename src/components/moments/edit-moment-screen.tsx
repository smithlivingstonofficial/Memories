"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  X,
} from "lucide-react";
import { editMomentAction } from "@/app/actions/moments";
import {
  LocationFields,
  type LocationSource,
} from "@/components/create/location-fields";
import { MoodSelector } from "@/components/create/mood-selector";
import { MEMORY_MOODS } from "@/lib/moods";
import type { EditableMoment } from "@/lib/moments/get-editable-moment";
import { cn } from "@/lib/utils";

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
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
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
  const selectedVisibility = visibilityOptions.find(
    (option) => option.value === visibility
  );

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
    <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-[1500px] space-y-3 pb-[13rem] sm:mx-auto sm:w-full sm:space-y-4 sm:pb-0">
      <section className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={`/moment/${moment.id}`}
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:mb-1"
            >
              <ArrowLeft size={16} />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Moment</span>
            </Link>

            <p className="hidden items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)] sm:inline-flex">
              <Sparkles size={14} />
              Moment Editor
            </p>

            <h1 className="mt-0 font-brand text-[1.65rem] font-semibold leading-tight text-[var(--app-text)] sm:mt-2 sm:text-4xl lg:text-3xl">
              Edit Moment
            </h1>
          </div>

          <div className="hidden flex-col gap-3 sm:flex lg:items-end">
            <div className="flex flex-wrap gap-2">
              <ComposerChip label="Visible" value={selectedVisibility?.label ?? "Followers"} />
              <ComposerChip label="Mood" value={selectedMoods[0] ?? "Peaceful"} />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Updating..." : "Update Moment"}
              {!isPending && <ChevronRight size={17} />}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="mem-card rounded-[1.2rem] p-3 sm:rounded-[2rem] sm:p-5">
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

        <aside className="space-y-3 sm:space-y-4">
          <SidePanelSection
            icon={<Sparkles size={17} />}
            title="Mood"
            description="Choose the feeling for this Moment."
            defaultOpen
          >
            <MoodSelector
              moods={MEMORY_MOODS}
              selectedMoods={selectedMoods}
              onChange={setSelectedMoods}
              maxSelections={1}
            />
          </SidePanelSection>

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

          <SidePanelSection
            icon={<ShieldCheck size={17} />}
            title="Visibility"
            description={selectedVisibility?.description ?? "Choose who can view this Moment."}
            defaultOpen
          >
            <div className="rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {selectedVisibility?.label ?? "Followers"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                    {selectedVisibility?.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibilityDialogOpen(true)}
                  disabled={isPending}
                  className="shrink-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--app-accent)] transition hover:border-[var(--app-accent)] disabled:opacity-60"
                >
                  Change
                </button>
              </div>
            </div>
          </SidePanelSection>

          {message && (
            <p className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-sm leading-6 text-[var(--app-muted)]">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="hidden h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
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

      <div className="fixed inset-x-2 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[0_18px_48px_var(--app-shadow)] backdrop-blur-2xl sm:hidden">
        <p className="mb-2 px-2 text-center text-[11px] font-semibold text-[var(--app-muted)]">
          {selectedVisibility?.label ?? "Followers"} - {selectedMoods[0] ?? "Peaceful"}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating..." : "Update Moment"}
          {!isPending && <ChevronRight size={17} />}
        </button>
      </div>

      <MomentVisibilityDialog
        isOpen={visibilityDialogOpen}
        selectedVisibility={visibility}
        onClose={() => setVisibilityDialogOpen(false)}
        onSelect={(nextVisibility) => {
          setVisibility(nextVisibility);
          setVisibilityDialogOpen(false);
        }}
      />
    </div>
  );
}

function ComposerChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs text-[var(--app-muted)]">
      <span className="font-semibold uppercase tracking-[0.14em]">
        {label}
      </span>
      <strong className="font-brand text-sm font-semibold text-[var(--app-text)]">
        {value}
      </strong>
    </span>
  );
}

function SidePanelSection({
  icon,
  title,
  description,
  action,
  defaultOpen = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(defaultOpen);

  return (
    <section className="mem-card-strong rounded-[1.35rem] p-3 sm:rounded-[1.7rem] sm:p-4">
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 text-left md:pointer-events-none"
        aria-expanded={mobileOpen}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)] sm:size-10">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block font-brand text-base font-semibold text-[var(--app-text)] sm:text-lg">
              {title}
            </span>
            <span className="mt-1 hidden text-xs leading-5 text-[var(--app-muted)] sm:block">
              {description}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {action && (
            <span className="rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              {action}
            </span>
          )}
          <ChevronRight
            size={18}
            className={cn(
              "text-[var(--app-muted)] transition md:hidden",
              mobileOpen && "rotate-90"
            )}
          />
        </span>
      </button>
      <div className={cn("mt-4", mobileOpen ? "block" : "hidden md:block")}>
        {children}
      </div>
    </section>
  );
}

function MomentVisibilityDialog({
  isOpen,
  selectedVisibility,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  selectedVisibility: MomentVisibility;
  onClose: () => void;
  onSelect: (visibility: MomentVisibility) => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-moment-visibility-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_24px_90px_var(--app-shadow)] sm:rounded-[2rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-moment-visibility-dialog-title"
              className="font-brand text-xl font-semibold text-[var(--app-text)]"
            >
              Change visibility
            </h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Choose who can view this Moment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            aria-label="Close visibility selector"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            const selected = selectedVisibility === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.15rem] border p-3 text-left transition",
                  selected
                    ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                <Icon size={17} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">
                    {option.description}
                  </span>
                </span>
                {selected && (
                  <Check size={17} className="ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
