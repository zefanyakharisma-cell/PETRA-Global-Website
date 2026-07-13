'use client';

import { clsx } from '@/lib/clsx';

/**
 * Visual layout picker. Renders each option as a small SVG diagram (a
 * "thumbnail") the editor clicks, instead of a plain dropdown, so choosing a
 * block's arrangement is a glanceable, visual decision. Diagrams are drawn from
 * a shared, data-driven shape map so every block reuses the same vocabulary.
 */

type Tone = 'soft' | 'strong' | 'dark';
type Rect = [number, number, number, number, Tone?];

const TONE: Record<Tone, string> = {
  soft: '#d7ddec', // light placeholder block
  strong: '#8b98b5', // emphasised block (media / accent)
  dark: '#334066', // heaviest (hero media, buttons)
};

// Each shape is a list of rounded rectangles inside a 60×40 canvas. Kept as
// plain data so the set stays compact and easy to extend.
const SHAPES: Record<string, Rect[]> = {
  // Generic arrangements
  stack: [[8, 8, 44, 6], [8, 18, 44, 6], [8, 28, 44, 6]],
  rows: [[8, 9, 44, 4], [8, 18, 44, 4], [8, 27, 44, 4]],
  'rows-thumb': [
    [8, 8, 7, 7, 'strong'], [18, 10, 34, 3],
    [8, 18, 7, 7, 'strong'], [18, 20, 34, 3],
    [8, 28, 7, 7, 'strong'], [18, 30, 34, 3],
  ],
  'grid-2': [[8, 10, 20, 20, 'soft'], [32, 10, 20, 20, 'soft']],
  'grid-3': [[6, 12, 14, 16, 'soft'], [23, 12, 14, 16, 'soft'], [40, 12, 14, 16, 'soft']],
  'grid-4': [[6, 12, 10, 16, 'soft'], [19, 12, 10, 16, 'soft'], [32, 12, 10, 16, 'soft'], [45, 12, 10, 16, 'soft']],
  cards: [
    [6, 9, 14, 22, 'soft'], [6, 9, 14, 4, 'strong'],
    [23, 9, 14, 22, 'soft'], [23, 9, 14, 4, 'strong'],
    [40, 9, 14, 22, 'soft'], [40, 9, 14, 4, 'strong'],
  ],
  masonry: [
    [7, 8, 15, 12, 'soft'], [7, 22, 15, 10, 'soft'],
    [25, 8, 15, 24, 'soft'],
    [43, 8, 15, 9, 'soft'], [43, 19, 15, 13, 'soft'],
  ],
  carousel: [
    [3, 11, 8, 16, 'soft'], [15, 8, 30, 22, 'strong'], [49, 11, 8, 16, 'soft'],
    [25, 34, 3, 3, 'strong'], [30, 34, 3, 3], [35, 34, 3, 3],
  ],
  'columns-3': [[8, 8, 12, 26, 'soft'], [24, 8, 12, 26, 'soft'], [40, 8, 12, 26, 'soft']],
  'two-col': [
    [8, 9, 20, 3], [8, 15, 20, 3], [8, 21, 20, 3], [8, 27, 14, 3],
    [32, 9, 20, 3], [32, 15, 20, 3], [32, 21, 16, 3],
  ],

  // Split (image + text)
  'split-left': [[7, 9, 22, 22, 'strong'], [33, 11, 20, 3], [33, 18, 20, 3], [33, 25, 13, 3]],
  'split-right': [[31, 9, 22, 22, 'strong'], [7, 11, 20, 3], [7, 18, 20, 3], [7, 25, 13, 3]],
  'split-stack': [[8, 7, 44, 15, 'strong'], [8, 26, 30, 3], [8, 32, 40, 3]],

  // Alignment / heading
  'align-left': [[8, 11, 30, 5, 'strong'], [8, 20, 40, 3], [8, 27, 34, 3]],
  'align-center': [[15, 11, 30, 5, 'strong'], [11, 20, 38, 3], [16, 27, 28, 3]],
  boxed: [[7, 8, 46, 24, 'soft'], [13, 13, 26, 5, 'strong'], [13, 22, 34, 3]],

  // Hero
  'hero-center': [[16, 10, 28, 6, 'strong'], [12, 20, 36, 4], [24, 29, 12, 5, 'dark']],
  'hero-left': [[8, 10, 30, 6, 'strong'], [8, 20, 36, 4], [8, 29, 12, 5, 'dark']],
  'hero-split': [[7, 11, 22, 4, 'strong'], [7, 18, 22, 4], [7, 26, 12, 4, 'dark'], [33, 8, 20, 24, 'strong']],
  'hero-immersive': [[4, 5, 52, 30, 'dark'], [18, 16, 24, 4, 'soft'], [22, 24, 16, 3, 'soft']],
  // Oversized two-line headline + CTA, with a full-width looping keyword strip.
  'hero-kinetic': [[8, 7, 40, 7, 'strong'], [8, 16, 30, 7, 'strong'], [8, 27, 12, 4, 'dark'], [4, 34, 52, 3, 'soft']],

  // Tabs
  'tabs-top': [[8, 8, 10, 4, 'strong'], [20, 8, 10, 4], [32, 8, 10, 4], [8, 15, 44, 18, 'soft']],
  'tabs-side': [[8, 9, 12, 4, 'strong'], [8, 16, 12, 4], [8, 23, 12, 4], [24, 9, 28, 22, 'soft']],
  pills: [[8, 9, 11, 5, 'strong'], [21, 9, 11, 5], [34, 9, 11, 5], [8, 18, 44, 15, 'soft']],

  // Timeline / steps
  'timeline-v': [
    [11, 8, 1.6, 26, 'strong'],
    [8.5, 9, 5, 5, 'strong'], [8.5, 19, 5, 5, 'strong'], [8.5, 29, 5, 5, 'strong'],
    [18, 10, 30, 3], [18, 20, 30, 3], [18, 30, 24, 3],
  ],
  'timeline-alt': [
    [29, 8, 1.6, 26, 'strong'],
    [27, 10, 5, 5, 'strong'], [10, 10, 15, 6, 'soft'],
    [27, 22, 5, 5, 'strong'], [35, 22, 15, 6, 'soft'],
  ],
  'timeline-h': [
    [8, 20, 44, 1.6, 'strong'],
    [10, 17, 5, 5, 'strong'], [28, 17, 5, 5, 'strong'], [46, 17, 5, 5, 'strong'],
    [8, 27, 11, 3], [26, 27, 11, 3], [44, 27, 10, 3],
  ],
  'steps-v': [
    [8, 9, 7, 7, 'strong'], [18, 11, 34, 3],
    [8, 19, 7, 7, 'strong'], [18, 21, 34, 3],
    [8, 29, 7, 7, 'strong'], [18, 31, 34, 3],
  ],
  'steps-h': [
    [10, 10, 7, 7, 'strong'], [27, 10, 7, 7, 'strong'], [44, 10, 7, 7, 'strong'],
    [8, 22, 11, 3], [26, 22, 11, 3], [44, 22, 10, 3],
  ],
  'steps-cards': [
    [6, 9, 14, 22, 'soft'], [8, 11, 5, 5, 'strong'],
    [23, 9, 14, 22, 'soft'], [25, 11, 5, 5, 'strong'],
    [40, 9, 14, 22, 'soft'], [42, 11, 5, 5, 'strong'],
  ],

  // Quote
  'quote-center': [[16, 12, 28, 4, 'strong'], [12, 20, 36, 4, 'strong'], [22, 29, 16, 3]],
  'quote-side': [[8, 12, 14, 14, 'strong'], [26, 13, 26, 4, 'strong'], [26, 20, 26, 4, 'strong'], [26, 27, 16, 3]],
  'quote-card': [[8, 8, 44, 24, 'soft'], [13, 13, 34, 4, 'strong'], [13, 20, 28, 4, 'strong'], [13, 27, 14, 3]],

  // Stats
  'stat-row': [[9, 14, 10, 12, 'strong'], [25, 14, 10, 12, 'strong'], [41, 14, 10, 12, 'strong']],
  'stat-cards': [
    [6, 9, 14, 22, 'soft'], [9, 13, 8, 7, 'strong'],
    [23, 9, 14, 22, 'soft'], [26, 13, 8, 7, 'strong'],
    [40, 9, 14, 22, 'soft'], [43, 13, 8, 7, 'strong'],
  ],
  'stat-stack': [[16, 8, 28, 7, 'strong'], [24, 17, 12, 3], [16, 24, 28, 7, 'strong'], [24, 33, 12, 3]],

  // Divider
  'divider-line': [[8, 20, 44, 1.6, 'strong']],
  'divider-dots': [[26, 19, 3, 3, 'strong'], [31, 19, 3, 3, 'strong'], [36, 19, 3, 3, 'strong']],
  'divider-space': [],

  // Feature list
  'feature-grid': [
    [7, 10, 14, 18, 'soft'], [9, 12, 6, 6, 'strong'],
    [23, 10, 14, 18, 'soft'], [25, 12, 6, 6, 'strong'],
    [39, 10, 14, 18, 'soft'], [41, 12, 6, 6, 'strong'],
  ],

  // Logo / marquee
  marquee: [
    [6, 10, 10, 7, 'strong'], [19, 10, 10, 7, 'strong'], [32, 10, 10, 7, 'strong'], [45, 10, 10, 7, 'strong'],
    [6, 22, 10, 7, 'strong'], [19, 22, 10, 7, 'strong'], [32, 22, 10, 7, 'strong'], [45, 22, 10, 7, 'strong'],
  ],
  'marquee-1': [[6, 16, 10, 8, 'strong'], [19, 16, 10, 8, 'strong'], [32, 16, 10, 8, 'strong'], [45, 16, 10, 8, 'strong']],
  'logo-grid': [
    [8, 9, 10, 7, 'strong'], [21, 9, 10, 7, 'strong'], [34, 9, 10, 7, 'strong'],
    [8, 20, 10, 7, 'strong'], [21, 20, 10, 7, 'strong'], [34, 20, 10, 7, 'strong'],
  ],

  // Map
  'map-center': [[22, 6, 16, 3, 'strong'], [10, 12, 40, 22, 'soft'], [20, 20, 3, 3, 'strong'], [30, 25, 3, 3, 'strong'], [38, 18, 3, 3, 'strong']],
  'map-left': [[8, 6, 16, 3, 'strong'], [10, 12, 40, 22, 'soft'], [20, 20, 3, 3, 'strong'], [30, 25, 3, 3, 'strong'], [38, 18, 3, 3, 'strong']],

  // Faculties
  explorer: [
    [8, 8, 44, 6, 'soft'], [8, 8, 3, 6, 'strong'],
    [8, 16, 44, 10, 'soft'], [8, 16, 3, 10, 'strong'], [14, 19, 28, 2], [14, 23, 22, 2],
    [8, 28, 44, 6, 'soft'], [8, 28, 3, 6, 'strong'],
  ],
  'faculty-grid': [
    [6, 9, 20, 22, 'soft'], [6, 9, 20, 6, 'strong'],
    [30, 9, 20, 22, 'soft'], [30, 9, 20, 6, 'strong'],
  ],
  'faculty-list': [
    [8, 9, 3, 5, 'strong'], [14, 9, 6, 5, 'soft'], [22, 10, 26, 3],
    [8, 18, 3, 5, 'strong'], [14, 18, 6, 5, 'soft'], [22, 19, 26, 3],
    [8, 27, 3, 5, 'strong'], [14, 27, 6, 5, 'soft'], [22, 28, 26, 3],
  ],
  'faculty-cover': [
    [6, 9, 20, 22, 'strong'], [9, 24, 14, 4, 'soft'],
    [30, 9, 20, 22, 'strong'], [33, 24, 14, 4, 'soft'],
  ],
  'faculty-finder': [
    [8, 7, 44, 5, 'strong'],
    [8, 15, 8, 3, 'dark'], [18, 15, 8, 3, 'soft'], [28, 15, 8, 3, 'soft'],
    [8, 22, 44, 5, 'soft'], [8, 29, 44, 5, 'soft'],
  ],

  // Forms
  'form-center': [[16, 8, 28, 4, 'strong'], [14, 15, 32, 5, 'soft'], [14, 22, 32, 5, 'soft'], [22, 30, 16, 5, 'dark']],
  'form-split': [
    [7, 11, 20, 4, 'strong'], [7, 18, 20, 3], [7, 24, 14, 3],
    [30, 10, 24, 5, 'soft'], [30, 18, 24, 5, 'soft'], [30, 26, 14, 5, 'dark'],
  ],

  // Cards emphasis
  featured: [[7, 8, 46, 16, 'strong'], [7, 27, 14, 7, 'soft'], [24, 27, 14, 7, 'soft'], [41, 27, 12, 7, 'soft']],

  // Embed
  wide: [[2, 8, 56, 24, 'strong']],
  framed: [[7, 7, 46, 22, 'strong'], [9, 9, 42, 18, 'soft'], [22, 32, 16, 2]],
  contained: [[10, 9, 40, 20, 'strong'], [22, 32, 16, 2]],

  // Staff directory
  'directory-grid': [
    [7, 10, 14, 18, 'soft'], [10, 12, 8, 8, 'strong'],
    [24, 10, 14, 18, 'soft'], [27, 12, 8, 8, 'strong'],
    [41, 10, 14, 18, 'soft'], [44, 12, 8, 8, 'strong'],
  ],
  'directory-list': [
    [8, 9, 7, 7, 'strong'], [18, 10, 30, 3], [18, 14, 20, 2],
    [8, 19, 7, 7, 'strong'], [18, 20, 30, 3], [18, 24, 20, 2],
    [8, 29, 7, 7, 'strong'], [18, 30, 30, 3],
  ],
  'person-card': [[10, 12, 12, 16, 'strong'], [26, 13, 26, 4, 'strong'], [26, 20, 20, 3], [26, 26, 14, 5, 'dark']],

  // Doors
  'doors-row': [
    [7, 9, 13, 22, 'soft'], [7, 9, 13, 4, 'strong'],
    [24, 9, 13, 22, 'soft'], [24, 9, 13, 4, 'strong'],
    [41, 9, 13, 22, 'soft'], [41, 9, 13, 4, 'strong'],
  ],
  'doors-stack': [
    [8, 8, 44, 7, 'soft'], [8, 8, 3, 7, 'strong'],
    [8, 17, 44, 7, 'soft'], [8, 17, 3, 7, 'strong'],
    [8, 26, 44, 7, 'soft'], [8, 26, 3, 7, 'strong'],
  ],
};

function Thumb({ shape }: { shape: string }) {
  const rects = SHAPES[shape] ?? SHAPES.stack;
  return (
    <svg viewBox="0 0 60 40" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <rect x={0} y={0} width={60} height={40} fill="#f4f6fb" />
      {rects.map(([x, y, w, h, tone], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={1.4} fill={TONE[tone ?? 'soft']} />
      ))}
    </svg>
  );
}

export function LayoutField({
  label,
  help,
  value,
  options,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  options: { value: string; label: string; shape: string }[];
  onChange: (v: string) => void;
}) {
  const current = value || options[0]?.value;
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              title={o.label}
              className={clsx(
                'group flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition',
                active ? 'border-navy bg-navy/[0.03] ring-2 ring-navy/15' : 'border-ink/15 hover:border-ink/35',
              )}
            >
              <span className="block aspect-[3/2] w-full overflow-hidden rounded-md ring-1 ring-inset ring-ink/10">
                <Thumb shape={o.shape} />
              </span>
              <span className={clsx('text-[11px] leading-tight', active ? 'font-medium text-navy' : 'text-ink/60')}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
      {help && <span className="mt-1 block text-[11px] text-ink/40">{help}</span>}
    </div>
  );
}
