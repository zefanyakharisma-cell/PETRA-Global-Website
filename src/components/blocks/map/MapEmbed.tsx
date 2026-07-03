'use client';

import dynamic from 'next/dynamic';
import type { MapCanvasProps } from './MapCanvas';

/**
 * Client-side loader for the interactive map. MapLibre GL touches `window` at
 * runtime, so the heavy canvas is imported with `ssr: false` — this keeps it out
 * of the server render (and the editor-preview iframe's SSR pass) and only
 * mounts it in the browser. A neutral placeholder fills the frame while it loads.
 */
const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-navy-2/10">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:300ms]" />
      </div>
    </div>
  ),
});

export function MapEmbed(props: MapCanvasProps) {
  return <MapCanvas {...props} />;
}
