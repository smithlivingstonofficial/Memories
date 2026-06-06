"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { Check, MapPin, X } from "lucide-react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { formatCoordinateLabel } from "@/lib/media/client-media-processing";

type LocationMapPickerProps = {
  initialLatitude: number | null;
  initialLongitude: number | null;
  onCancel: () => void;
  onSelect: (location: {
    locationName: string;
    latitude: number;
    longitude: number;
  }) => void;
};

const defaultCenter: [number, number] = [20.5937, 78.9629];

const pickerIcon = L.divIcon({
  className: "",
  html: '<span class="memory-map-marker"><span class="memory-map-marker__pulse"></span><span class="memory-map-marker__core"></span></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export function LocationMapPicker({
  initialLatitude,
  initialLongitude,
  onCancel,
  onSelect,
}: LocationMapPickerProps) {
  const initialPosition = useMemo<[number, number] | null>(() => {
    if (initialLatitude === null || initialLongitude === null) return null;
    return [initialLatitude, initialLongitude];
  }, [initialLatitude, initialLongitude]);
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(initialPosition);
  const center = initialPosition ?? defaultCenter;
  const portalRoot = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function confirmSelection() {
    if (!selectedPosition) return;

    const [latitude, longitude] = selectedPosition;
    onSelect({
      locationName: formatCoordinateLabel(latitude, longitude),
      latitude,
      longitude,
    });
  }

  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 top-16 z-[1800] flex items-start justify-center bg-slate-950/72 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md sm:inset-0 sm:items-center sm:p-4">
      <div className="flex h-full max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[1.35rem] border border-white/15 bg-slate-950 text-white shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:h-[min(78dvh,640px)] sm:rounded-[1.6rem]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <MapPin size={14} />
              Satellite picker
            </p>
            <h2 className="mt-1.5 font-brand text-base font-semibold tracking-[-0.04em] sm:mt-2 sm:text-lg">
              Select memory location
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Close map picker"
          >
            <X size={19} />
          </button>
        </div>

        <div className="relative min-h-[240px] flex-1">
          <MapContainer
            center={center}
            zoom={initialPosition ? 16 : 5}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution="Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <LegalAttributionControl />
            <PickerResize />
            <PickerClickTarget onPick={setSelectedPosition} />
            {selectedPosition && (
              <Marker position={selectedPosition} icon={pickerIcon} />
            )}
          </MapContainer>

          <div className="pointer-events-none absolute inset-x-3 top-3 z-[900] rounded-2xl border border-white/10 bg-slate-950/82 px-3 py-2 text-xs font-semibold leading-5 text-white shadow-[0_14px_34px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:inset-x-auto sm:left-4 sm:max-w-sm">
            Tap or click the satellite map to place the location pointer.
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmSelection}
            disabled={!selectedPosition}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#A5B4FC,#6366F1_52%,#4F46E5)] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(99,102,241,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-55"
          >
            Set location
            <Check size={17} />
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
}

function LegalAttributionControl() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);

  return null;
}

function PickerResize() {
  const map = useMap();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
}

function PickerClickTarget({
  onPick,
}: {
  onPick: (position: [number, number]) => void;
}) {
  useMapEvents({
    click: (event) => {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}
