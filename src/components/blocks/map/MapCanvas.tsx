'use client';

import { useEffect } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapRoute,
  MapControls,
  useMap,
} from '@/components/ui/mapcn-map-arc';

/** One plotted location. Labels are already resolved to the active locale server-side. */
export type MapPoint = { label: string; lat: number; lng: number };

export interface MapCanvasProps {
  points: MapPoint[];
  /** Fallback centre [lng, lat] used for a single marker (multi-marker maps auto-fit). */
  center: [number, number];
  zoom: number;
  theme: 'light' | 'dark';
  /** Hex colour for the route line + numbered markers. */
  accentColor: string;
  showRoute: boolean;
  showControls: boolean;
}

/**
 * Fits the viewport to all markers once the map (and its style) have loaded.
 * Lives as a child of <Map> so it can read the map instance + loaded flag from
 * context — <Map> only renders children after the instance exists.
 */
function FitToPoints({ points }: { points: MapPoint[] }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map || points.length < 2) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, maxZoom: 14, duration: 0 },
    );
  }, [isLoaded, map, points]);

  return null;
}

/**
 * Interactive MapLibre canvas for the CMS "Map" block. Renders numbered pins for
 * every location, an optional route line connecting them in order, and optional
 * zoom/fullscreen controls. Built on the shared mapcn primitives.
 */
export default function MapCanvas({
  points,
  center,
  zoom,
  theme,
  accentColor,
  showRoute,
  showControls,
}: MapCanvasProps) {
  const route = points.map((p) => [p.lng, p.lat]) as [number, number][];

  return (
    <Map center={center} zoom={zoom} theme={theme}>
      {showRoute && route.length >= 2 && (
        <MapRoute coordinates={route} color={accentColor} width={4} opacity={0.85} />
      )}

      {points.map((p, i) => (
        <MapMarker key={`${p.lat},${p.lng},${i}`} longitude={p.lng} latitude={p.lat}>
          <MarkerContent>
            <div
              className="flex size-5 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold leading-none text-white shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {i + 1}
            </div>
          </MarkerContent>
          {p.label && <MarkerTooltip>{p.label}</MarkerTooltip>}
        </MapMarker>
      ))}

      {showControls && <MapControls position="top-right" showZoom showFullscreen />}

      <FitToPoints points={points} />
    </Map>
  );
}
