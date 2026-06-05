"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Map, MapPin } from "lucide-react";
import { formatCoordinateLabel } from "@/lib/media/client-media-processing";

const LocationMapPicker = dynamic(
  () =>
    import("@/components/create/location-map-picker").then(
      (mod) => mod.LocationMapPicker
    ),
  {
    ssr: false,
  }
);

export type LocationSource =
  | "manual"
  | "browser_gps"
  | "media_gps"
  | "mixed_media"
  | "unknown";

type LocationFieldsProps = {
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: LocationSource;
  locationConfidence: number | null;
  locationAccuracyMeters: number | null;
  locationMessage: string;
  placeholder?: string;
  onLocationNameChange: (value: string) => void;
  onLocationChange: (location: {
    locationName: string;
    latitude: number | null;
    longitude: number | null;
    locationSource: LocationSource;
    locationConfidence: number | null;
    locationAccuracyMeters: number | null;
    locationMessage: string;
  }) => void;
};

export function LocationFields({
  locationName,
  latitude,
  longitude,
  locationSource,
  locationConfidence,
  locationAccuracyMeters,
  locationMessage,
  placeholder = "Coimbatore, Tamil Nadu",
  onLocationNameChange,
  onLocationChange,
}: LocationFieldsProps) {
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  function useCurrentLocation() {
    onLocationChange({
      locationName,
      latitude,
      longitude,
      locationSource,
      locationConfidence,
      locationAccuracyMeters,
      locationMessage: "",
    });

    if (!navigator.geolocation) {
      onLocationChange({
        locationName,
        latitude,
        longitude,
        locationSource,
        locationConfidence,
        locationAccuracyMeters,
        locationMessage: "GPS location is not available in this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;

        onLocationChange({
          locationName: formatCoordinateLabel(nextLatitude, nextLongitude),
          latitude: nextLatitude,
          longitude: nextLongitude,
          locationSource: "browser_gps",
          locationConfidence: 1,
          locationAccuracyMeters: position.coords.accuracy,
          locationMessage: "Current location added.",
        });
      },
      () => {
        onLocationChange({
          locationName,
          latitude,
          longitude,
          locationSource,
          locationConfidence,
          locationAccuracyMeters,
          locationMessage:
            "Location permission was denied. You can enter it manually.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <div className="mem-card-strong rounded-[1.35rem] p-3 sm:rounded-[1.7rem] sm:p-4 lg:p-3">
      <input type="hidden" name="locationLabel" value={locationName} />
      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />
      <input type="hidden" name="locationSource" value={locationSource} />
      <input type="hidden" name="locationVisibility" value="private" />
      <input
        type="hidden"
        name="locationConfidence"
        value={locationConfidence ?? ""}
      />
      <input
        type="hidden"
        name="locationAccuracyMeters"
        value={locationAccuracyMeters ?? ""}
      />

      <div className="mb-3 flex items-start gap-2">
        <MapPin size={16} className="mt-0.5 text-[var(--app-accent)]" />
        <div>
          <label className="block text-sm font-semibold text-[var(--app-text)]">
            Add Location
          </label>
          <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
            Location is optional and can stay private.
          </p>
        </div>
      </div>

      <input
        name="locationName"
        value={locationName}
        onChange={(event) => onLocationNameChange(event.target.value)}
        placeholder={placeholder}
        className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)] lg:h-11"
      />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={useCurrentLocation}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:h-9"
        >
          Use current location
        </button>

        <button
          type="button"
          onClick={() => setMapPickerOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:h-9"
        >
          <Map size={14} />
          Choose on map
        </button>

        <button
          type="button"
          onClick={() =>
            onLocationChange({
              locationName: "",
              latitude: null,
              longitude: null,
              locationSource: "unknown",
              locationConfidence: null,
              locationAccuracyMeters: null,
              locationMessage: "Location skipped.",
            })
          }
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)] lg:h-9"
        >
          Skip location
        </button>
      </div>

      {locationMessage && (
        <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
          {locationMessage}
        </p>
      )}

      {latitude !== null && longitude !== null && (
        <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
          Coordinates saved for future map view.
        </p>
      )}

      {mapPickerOpen && (
        <LocationMapPicker
          initialLatitude={latitude}
          initialLongitude={longitude}
          onCancel={() => setMapPickerOpen(false)}
          onSelect={(location) => {
            onLocationChange({
              locationName: location.locationName,
              latitude: location.latitude,
              longitude: location.longitude,
              locationSource: "manual",
              locationConfidence: 1,
              locationAccuracyMeters: null,
              locationMessage: "Map location selected.",
            });
            setMapPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
