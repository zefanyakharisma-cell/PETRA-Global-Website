'use client';

import { WorldMap, type WorldMapDot } from '@/components/ui/world-map';
import type { Region } from 'dotted-map';

/**
 * Public-facing wrapper around the animated dotted WorldMap. Centralises the
 * brand styling (cyan arcs on the navy surface) so the CMS block stays declarative.
 */
export function PartnerWorldMapLoader({
  dots,
  region,
  loop = true,
}: {
  dots: WorldMapDot[];
  region?: Region;
  loop?: boolean;
}) {
  return (
    <WorldMap
      dots={dots}
      region={region}
      loop={loop}
      lineColor="#54feeb"
      theme="dark"
      showLabels={false}
    />
  );
}
