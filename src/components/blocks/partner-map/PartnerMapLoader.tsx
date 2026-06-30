'use client';

import dynamic from 'next/dynamic';
import type { PartnerMarker } from '../PartnerMapBlock';

// Code-split: the map + topojson runtime never enters the public critical bundle.
const PartnerMap = dynamic(() => import('./PartnerMap').then((m) => m.PartnerMap), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[2/1] w-full items-center justify-center rounded-2xl bg-white/5 text-white/50">
      Loading map…
    </div>
  ),
});

export function PartnerMapLoader({
  markers,
  defaultZoom,
  center,
}: {
  markers: PartnerMarker[];
  defaultZoom: number;
  center?: [number, number];
}) {
  return <PartnerMap markers={markers} defaultZoom={defaultZoom} center={center} />;
}
