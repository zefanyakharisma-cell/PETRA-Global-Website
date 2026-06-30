'use client';

import {
  Map,
  MapArc,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerTooltip,
} from '@/components/ui/mapcn-map-arc';
import type { PartnerMarker } from '../PartnerMapBlock';

// Petra Christian University, Siwalankerto, Surabaya — the network hub every
// international partnership arcs out from.
const HUB = { name: 'Petra Christian University', lng: 112.7385, lat: -7.3437 };

const MAGENTA = '#ec008c'; // international accent (matches PartnerMap legend)
const AMBER = '#ffbc00';

/**
 * Arc-globe variant of the partner map (mapcn). Renders each international
 * partner as a node with a magenta great-circle arc back to Petra in Surabaya.
 * Globe projection + dark Carto basemap mirror the reference demo.
 */
export function PartnerArcMap({
  markers,
  defaultZoom = 1.4,
  center = [HUB.lng, HUB.lat],
}: {
  markers: PartnerMarker[];
  defaultZoom?: number;
  center?: [number, number];
}) {
  const arcs = markers.map((m, i) => ({
    id: `${i}-${m.name}`,
    from: [HUB.lng, HUB.lat] as [number, number],
    to: [m.lng, m.lat] as [number, number],
  }));

  return (
    <div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <div className="h-[480px] w-full">
          <Map
            theme="dark"
            center={center}
            zoom={defaultZoom}
            projection={{ type: 'globe' }}
          >
            <MapArc
              data={arcs}
              curvature={0.3}
              interactive={false}
              paint={{ 'line-color': MAGENTA, 'line-width': 1.2, 'line-opacity': 0.6 }}
            />

            {/* Hub */}
            <MapMarker longitude={HUB.lng} latitude={HUB.lat}>
              <MarkerContent>
                <div
                  className="size-3 rounded-full border-2 border-white shadow-md"
                  style={{ background: AMBER }}
                />
                <MarkerLabel
                  position="top"
                  className="rounded-sm bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur"
                >
                  {HUB.name}
                </MarkerLabel>
              </MarkerContent>
            </MapMarker>

            {/* Partners */}
            {markers.map((m, i) => (
              <MapMarker
                key={`${i}-${m.name}`}
                longitude={m.lng}
                latitude={m.lat}
                onClick={() => m.url && window.open(m.url, '_blank', 'noopener')}
              >
                <MarkerContent className={m.url ? 'cursor-pointer' : 'cursor-default'}>
                  <div
                    className="size-2 rounded-full border border-white shadow transition-transform hover:scale-150"
                    style={{ background: MAGENTA }}
                  />
                  <MarkerTooltip className="bg-white text-ink">
                    <span className="font-semibold">{m.name}</span>
                    {m.country && <span className="text-ink/60"> · {m.country}</span>}
                  </MarkerTooltip>
                </MarkerContent>
              </MapMarker>
            ))}

            <MapControls position="bottom-right" showZoom showCompass />
          </Map>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-6 text-sm text-white/70">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: AMBER }} /> Petra (Surabaya)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: MAGENTA }} /> International partner
        </span>
      </div>
    </div>
  );
}
