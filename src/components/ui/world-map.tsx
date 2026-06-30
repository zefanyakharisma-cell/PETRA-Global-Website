'use client';

/**
 * Animated dotted world map (adapted from the aceternity "WorldMap" component).
 *
 * Changes from the upstream snippet for this codebase:
 *  - No `next-themes` dependency — the site has a single (navy) surface, so the
 *    palette is driven by an explicit `theme` prop (defaults to `dark`).
 *  - Region-aware: projection uses dotted-map's own `getPin()` + image bounds,
 *    so the same component renders the full globe (international) or a zoomed
 *    Indonesia frame (domestic) just by passing a `region`.
 *  - Labels/markers live in an absolutely-positioned HTML layer (positioned by
 *    percentage) instead of SVG `<foreignObject>`, so text stays crisp at any
 *    map size and we avoid font-sizing in SVG user units.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DottedMap, { type Region } from 'dotted-map';

export interface WorldMapDot {
  start: { lat: number; lng: number; label?: string };
  end: { lat: number; lng: number; label?: string };
}

interface WorldMapProps {
  dots?: WorldMapDot[];
  /** Stroke/accent colour for the arcs and markers. */
  lineColor?: string;
  theme?: 'light' | 'dark';
  /** Optional bounding box to zoom the dotted map (e.g. Indonesia only). */
  region?: Region;
  /** dotted-map grid resolution. Higher = denser dots. */
  mapHeight?: number;
  grid?: 'vertical' | 'diagonal';
  /** Render every label statically. When false, labels appear on hover only. */
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
  className?: string;
}

export function WorldMap({
  dots = [],
  lineColor = '#54feeb',
  theme = 'dark',
  region,
  mapHeight = 100,
  grid = 'diagonal',
  showLabels = false,
  animationDuration = 2,
  loop = true,
  className,
}: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const map = useMemo(
    () => new DottedMap({ height: mapHeight, grid, ...(region ? { region } : {}) }),
    [mapHeight, grid, region],
  );

  const { width, height } = map.image;

  const svgMap = useMemo(
    () =>
      map.getSVG({
        radius: 0.22,
        color: theme === 'dark' ? '#FFFFFF55' : '#00000040',
        shape: 'circle',
        backgroundColor: 'transparent',
      }),
    [map, theme],
  );

  // Project lat/lng into the dotted map's own coordinate space (== the SVG
  // viewBox), snapping to the nearest dot. Falls back to a linear projection
  // across the region bounds when a point has no nearby grid dot.
  const project = (lat: number, lng: number) => {
    const pin = map.getPin({ lat, lng });
    if (pin) return { x: pin.x, y: pin.y };
    const { lat: la, lng: ln } = map.image.region;
    return {
      x: ((lng - ln.min) / (ln.max - ln.min)) * width,
      y: ((la.max - lat) / (la.max - la.min)) * height,
    };
  };

  const curvedPath = (s: { x: number; y: number }, e: { x: number; y: number }) => {
    const dist = Math.hypot(e.x - s.x, e.y - s.y);
    const lift = Math.min(dist * 0.35, height * 0.6);
    const midX = (s.x + e.x) / 2;
    const midY = Math.min(s.y, e.y) - lift;
    return `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}`;
  };

  const scale = width / 200;
  const strokeWidth = Math.max(0.4, 0.6 * scale);

  // Animation timing (mirrors the original staggered draw + pause loop).
  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycle = totalAnimationTime + pauseTime;

  // Unique destination + origin markers for the HTML overlay.
  const markers = useMemo(() => {
    const seen = new Map<string, { lat: number; lng: number; label?: string }>();
    for (const d of dots) {
      const sKey = `${d.start.lat},${d.start.lng}`;
      const eKey = `${d.end.lat},${d.end.lng}`;
      if (!seen.has(sKey)) seen.set(sKey, d.start);
      if (!seen.has(eKey)) seen.set(eKey, d.end);
    }
    return [...seen.values()].map((m) => {
      const p = project(m.lat, m.lng);
      return { ...m, left: (p.x / width) * 100, top: (p.y / height) * 100 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dots, width, height, map]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${className ?? ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="pointer-events-none h-full w-full select-none object-cover [mask-image:linear-gradient(to_bottom,transparent,white_8%,white_92%,transparent)]"
        alt="Partner network map"
        draggable={false}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="world-map-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const s = project(dot.start.lat, dot.start.lng);
          const e = project(dot.end.lat, dot.end.lng);
          const d = curvedPath(s, e);

          const startTime = (i * staggerDelay) / fullCycle;
          const endTime = (i * staggerDelay + animationDuration) / fullCycle;
          const resetTime = totalAnimationTime / fullCycle;

          return (
            <g key={`arc-${i}`}>
              <motion.path
                d={d}
                fill="none"
                stroke="url(#world-map-line)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={
                  loop
                    ? {
                        duration: fullCycle,
                        times: [0, startTime, endTime, resetTime, 1],
                        ease: 'easeInOut',
                        repeat: Infinity,
                      }
                    : { duration: animationDuration, delay: i * staggerDelay, ease: 'easeInOut' }
                }
              />
              {loop && (
                <motion.circle
                  r={strokeWidth * 1.6}
                  fill={lineColor}
                  initial={{ opacity: 0 }}
                  animate={{
                    offsetDistance: ['0%', '0%', '100%', '100%', '100%'],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycle,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }}
                  style={{ offsetPath: `path('${d}')` }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Marker + label overlay (crisp HTML, positioned by percentage). */}
      <div className="pointer-events-none absolute inset-0">
        {markers.map((m, i) => {
          const isHovered = hovered === (m.label ?? `${m.lat},${m.lng}`);
          return (
            <div
              key={`marker-${i}`}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.left}%`, top: `${m.top}%` }}
              onMouseEnter={() => setHovered(m.label ?? `${m.lat},${m.lng}`)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: lineColor }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white/70"
                  style={{ backgroundColor: lineColor }}
                />
              </span>

              {(showLabels || isHovered || m.label?.startsWith('★')) && m.label && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[140%] whitespace-nowrap rounded-md border border-white/15 bg-black/85 px-2 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm"
                >
                  {m.label.replace(/^★\s*/, '')}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
