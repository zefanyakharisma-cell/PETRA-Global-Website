'use client';

import dynamic from 'next/dynamic';
import type { ChartCanvasProps } from './ChartCanvas';

/**
 * Client-side loader for the Recharts canvas. Recharts' ResponsiveContainer
 * measures the DOM at runtime, so the chart is imported with `ssr: false` — this
 * keeps it out of the server render (and the editor-preview iframe's SSR pass)
 * and only mounts it in the browser. A neutral placeholder fills the frame while
 * it loads (mirrors map/MapEmbed).
 */
const ChartCanvas = dynamic(() => import('./ChartCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:300ms]" />
      </div>
    </div>
  ),
});

export function ChartEmbed(props: ChartCanvasProps) {
  return <ChartCanvas {...props} />;
}
