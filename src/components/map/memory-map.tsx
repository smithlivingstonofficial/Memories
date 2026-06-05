"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import Link from "next/link";
import { Layers, LocateFixed } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { MemoryMapItem } from "@/lib/map/get-memory-map-data";

type MemoryMapProps = {
  memories: MemoryMapItem[];
};

type MapTheme = "dark" | "light" | "satellite";

type MemoryGroup = {
  id: string;
  position: [number, number];
  memories: MemoryMapItem[];
};

const defaultCenter: [number, number] = [20.5937, 78.9629];

const mapThemes = {
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
  },
  light: {
    label: "Map",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
} satisfies Record<MapTheme, { label: string; url: string; attribution: string }>;

const memoryIcon = L.divIcon({
  className: "",
  html: '<span class="memory-map-marker"><span class="memory-map-marker__pulse"></span><span class="memory-map-marker__core"></span></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

export function MemoryMap({ memories }: MemoryMapProps) {
  const [theme, setTheme] = useState<MapTheme>("dark");
  const [currentLocation, setCurrentLocation] = useState<[number, number]>();
  const [locating, setLocating] = useState(false);
  const center =
    memories.length > 0
      ? ([memories[0].locationLat, memories[0].locationLng] as [number, number])
      : defaultCenter;

  function useCurrentLocation(map: L.Map) {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setCurrentLocation(coords);
        map.flyTo(coords, Math.max(map.getZoom(), 14), {
          animate: true,
          duration: 0.75,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      }
    );
  }

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden bg-slate-950">
      <MapContainer
        center={center}
        zoom={memories.length > 0 ? 11 : 5}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={mapThemes[theme].attribution}
          url={mapThemes[theme].url}
        />

        <LegalAttributionControl />
        <MapResize />
        <MapZoomControls />
        <ClusteredMemoryMarkers memories={memories} />
        {currentLocation && (
          <CircleMarker
            center={currentLocation}
            pathOptions={{
              color: "#7c83ff",
              fillColor: "#7c83ff",
              fillOpacity: 0.25,
              weight: 2,
            }}
            radius={12}
          />
        )}
        <MapControls
          locating={locating}
          theme={theme}
          onLocate={useCurrentLocation}
          onToggleTheme={() => setTheme((current) => getNextTheme(current))}
        />
      </MapContainer>
    </div>
  );
}

function LegalAttributionControl() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);

  return null;
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
}

function MapControls({
  locating,
  theme,
  onLocate,
  onToggleTheme,
}: {
  locating: boolean;
  theme: MapTheme;
  onLocate: (map: L.Map) => void;
  onToggleTheme: () => void;
}) {
  const map = useMap();

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[900] flex flex-col gap-2 sm:right-5 sm:top-5">
      <button
        type="button"
        onClick={onToggleTheme}
        className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/82 px-3 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(2,6,23,0.35)] backdrop-blur-xl transition hover:bg-slate-900"
        aria-label="Change map theme"
        title="Change map theme"
      >
        <Layers size={17} />
        {mapThemes[getNextTheme(theme)].label}
      </button>
      <button
        type="button"
        onClick={() => onLocate(map)}
        disabled={locating}
        className="pointer-events-auto flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/82 text-white shadow-[0_14px_34px_rgba(2,6,23,0.35)] backdrop-blur-xl transition hover:bg-slate-900 disabled:cursor-wait disabled:opacity-70"
        aria-label="Use current location"
        title="Use current location"
      >
        <LocateFixed size={20} className={locating ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}

function MapZoomControls() {
  const map = useMap();

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[900] flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/82 text-white shadow-[0_14px_34px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:left-5 sm:top-5">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="pointer-events-auto flex size-11 items-center justify-center text-2xl font-light leading-none transition hover:bg-white/10 active:scale-95"
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <div className="h-px bg-white/10" />
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="pointer-events-auto flex size-11 items-center justify-center text-2xl font-light leading-none transition hover:bg-white/10 active:scale-95"
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
    </div>
  );
}

function ClusteredMemoryMarkers({ memories }: { memories: MemoryMapItem[] }) {
  const map = useMap();
  const [version, setVersion] = useState(0);

  useMapEvents({
    moveend: () => setVersion((current) => current + 1),
    zoomend: () => setVersion((current) => current + 1),
  });

  const groups = useMemo(
    () => buildMemoryGroups(memories, map),
    [map, memories, version]
  );

  return (
    <>
      {groups.map((group) =>
        group.memories.length > 1 ? (
          <Marker
            key={group.id}
            position={group.position}
            icon={createClusterIcon(group.memories.length)}
            eventHandlers={{
              click: () => {
                map.flyTo(group.position, Math.min(map.getZoom() + 3, 18), {
                  animate: true,
                  duration: 0.65,
                });
              },
            }}
          >
            <Popup>
              <div className="max-w-[230px]">
                <p className="font-semibold text-slate-950">
                  {group.memories.length} memories nearby
                </p>
                <div className="mt-2 space-y-2">
                  {group.memories.slice(0, 4).map((memory) => (
                    <Link
                      key={memory.id}
                      href={`/memory/${memory.id}`}
                      className="block rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {memory.title}
                    </Link>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : (
          <MemoryMarker key={group.memories[0].id} memory={group.memories[0]} />
        )
      )}
    </>
  );
}

function MemoryMarker({ memory }: { memory: MemoryMapItem }) {
  return (
    <Marker
      position={[memory.locationLat, memory.locationLng]}
      icon={memoryIcon}
    >
      <Popup>
        <div className="max-w-[220px]">
          <p className="font-semibold text-slate-950">{memory.title}</p>
          {memory.locationName && (
            <p className="mt-1 text-xs text-slate-600">
              {memory.locationName}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(memory.createdAt)}
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-700">
            {previewText(memory.content)}
          </p>
          <Link
            href={`/memory/${memory.id}`}
            className="mt-3 inline-flex text-xs font-semibold text-indigo-600"
          >
            Open memory
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}

function buildMemoryGroups(memories: MemoryMapItem[], map: L.Map) {
  const groups: MemoryGroup[] = [];
  const clusterRadius = map.getZoom() >= 17 ? 20 : 42;

  for (const memory of memories) {
    const point = map.latLngToLayerPoint([memory.locationLat, memory.locationLng]);
    const matchingGroup = groups.find((group) => {
      const groupPoint = map.latLngToLayerPoint(group.position);
      return point.distanceTo(groupPoint) <= clusterRadius;
    });

    if (!matchingGroup) {
      groups.push({
        id: memory.id,
        position: [memory.locationLat, memory.locationLng],
        memories: [memory],
      });
      continue;
    }

    matchingGroup.memories.push(memory);
    matchingGroup.position = [
      average(matchingGroup.memories.map((item) => item.locationLat)),
      average(matchingGroup.memories.map((item) => item.locationLng)),
    ];
  }

  return groups;
}

function createClusterIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<span class="memory-map-cluster"><span class="memory-map-cluster__halo"></span><span class="memory-map-cluster__core">${count}</span></span>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -24],
  });
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getNextTheme(theme: MapTheme): MapTheme {
  if (theme === "dark") return "light";
  if (theme === "light") return "satellite";
  return "dark";
}

function previewText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "No preview available.";
  return clean.length > 120 ? `${clean.slice(0, 120)}...` : clean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
