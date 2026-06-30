'use client';

import dynamic from 'next/dynamic';
import type { PartnerMarker } from '../PartnerMapBlock';

// Code-split: maplibre-gl (the WebGL globe runtime) never enters the public
// critical bundle and only loads on the client (it touches window on import).
const PartnerArcMap = dynamic(() => import('./PartnerArcMap').then((m) => m.PartnerArcMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-2xl bg-white/5 text-white/50">
      Loading map…
    </div>
  ),
});

export function PartnerArcMapLoader({
  markers,
  defaultZoom,
  center,
}: {
  markers: PartnerMarker[];
  defaultZoom?: number;
  center?: [number, number];
}) {
  return <PartnerArcMap markers={markers} defaultZoom={defaultZoom} center={center} />;
}
