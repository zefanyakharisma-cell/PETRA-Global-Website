'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import type { PartnerMarker } from '../PartnerMapBlock';

// Public-domain world topology (110m). Swap to a local /public asset for offline.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const ACCENT = { international: '#ec008c', domestic: '#ffbc00' } as const;

export function PartnerMap({
  markers,
  defaultZoom,
  center = [10, 25],
}: {
  markers: PartnerMarker[];
  defaultZoom: number;
  center?: [number, number];
}) {
  const [hover, setHover] = useState<PartnerMarker | null>(null);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl bg-navy-2/30 ring-1 ring-white/10">
        <ComposableMap projectionConfig={{ scale: 150 }} className="h-auto w-full">
          <ZoomableGroup zoom={defaultZoom} center={center}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1c4067"
                    stroke="#133256"
                    strokeWidth={0.4}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: '#245484' }, pressed: { outline: 'none' } }}
                  />
                ))
              }
            </Geographies>
            {markers.map((m, i) => (
              <Marker
                key={i}
                coordinates={[m.lng, m.lat]}
                onMouseEnter={() => setHover(m)}
                onMouseLeave={() => setHover(null)}
                onClick={() => m.url && window.open(m.url, '_blank', 'noopener')}
                style={{ default: { cursor: m.url ? 'pointer' : 'default' } }}
              >
                <circle
                  r={4}
                  fill={ACCENT[m.kind]}
                  stroke="#fff"
                  strokeWidth={1}
                  className="transition-transform hover:scale-150"
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-white px-3 py-1.5 text-sm text-ink shadow-lg">
          <span className="font-semibold">{hover.name}</span>
          {hover.country && <span className="text-ink/60"> · {hover.country}</span>}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-6 text-sm text-white/70">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ACCENT.international }} /> International</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ACCENT.domestic }} /> Domestic</span>
      </div>
    </div>
  );
}
