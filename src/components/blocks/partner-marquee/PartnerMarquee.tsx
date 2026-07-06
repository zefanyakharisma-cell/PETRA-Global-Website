'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { Section, Container } from '@/components/ui/Section';
import { InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import type { BlockBaseConfig, Locale } from '@/lib/types';

export interface MarqueeFaculty {
  faculty: string;
  programs: string[];
}

export interface MarqueePartner {
  name: string;
  country?: string | null;
  /** Uploaded logo, if any. When absent the tile falls back to a text card. */
  logoUrl?: string | null;
  url?: string | null;
  /** Agreement expiry, already formatted for display (e.g. "2027", "No fixed end date"). */
  expiry?: string | null;
  faculties?: MarqueeFaculty[];
}

const LABELS = {
  en: { country: 'Country', cooperation: 'Cooperating faculties & study programs', validUntil: 'Agreement valid until', visit: 'Visit website', close: 'Close', none: 'University-wide / no specific study program listed.' },
  id: { country: 'Negara', cooperation: 'Fakultas & program studi yang bekerja sama', validUntil: 'Perjanjian berlaku hingga', visit: 'Kunjungi situs', close: 'Tutup', none: 'Tingkat universitas / tidak ada program studi spesifik.' },
} as const;

/** Split partners into `rows` near-equal lanes, round-robin so each lane is varied. */
function intoRows<T>(items: T[], rows: number): T[][] {
  const lanes: T[][] = Array.from({ length: rows }, () => []);
  items.forEach((item, i) => lanes[i % rows].push(item));
  return lanes.filter((l) => l.length > 0);
}

export function PartnerMarquee({
  partners,
  heading,
  config,
  locale,
}: {
  partners: MarqueePartner[];
  heading?: string;
  config: BlockBaseConfig;
  locale: Locale;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<MarqueePartner | null>(null);
  const L = LABELS[locale === 'id' ? 'id' : 'en'];

  // Close the popup on Escape.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  // rows = auto-lane scrolling (default) · single = one scrolling lane ·
  // static = no motion, wrapped grid of every tile.
  const layout = (config.layout as string) ?? 'rows';
  const laneCount = layout === 'single' ? 1 : partners.length > 24 ? 3 : partners.length > 10 ? 2 : 1;
  const rows = intoRows(partners, laneCount);
  const staticGrid = reduce || layout === 'static';

  const Tile = ({ p }: { p: MarqueePartner }) => (
    <button
      type="button"
      onClick={() => setActive(p)}
      aria-label={p.name}
      className="group relative mx-2 flex h-20 w-40 shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
    >
      {p.logoUrl ? (
        <span className="relative h-full w-full">
          <Image src={p.logoUrl} alt={p.name} fill className="object-contain transition group-hover:scale-105" sizes="160px" />
        </span>
      ) : (
        // No logo uploaded — show the name (and place) as a compact text card.
        <span className="flex h-full w-full flex-col items-center justify-center text-center">
          <span className="line-clamp-3 text-xs font-medium leading-tight text-navy transition group-hover:text-magenta">
            {p.name}
          </span>
          {p.country && (
            <span className="mt-1 font-condensed text-[10px] uppercase tracking-wide text-ink/45">
              {p.country}
            </span>
          )}
        </span>
      )}
    </button>
  );

  return (
    <Section config={{ ...config, background: config.background ?? 'navy' }}>
      {heading && (
        <Container>
          <InlineHtml as="h2" html={heading} className="mb-8 text-center text-3xl text-white md:text-4xl" />
        </Container>
      )}

      {staticGrid ? (
        // Static grid: show every logo without scrolling (also honours reduced motion).
        <Container>
          <div className="flex flex-wrap justify-center gap-3">
            {partners.map((p, i) => <Tile key={i} p={p} />)}
          </div>
        </Container>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((lane, r) => {
            const duration = Math.max(20, lane.length * 6);
            return (
              <div
                key={r}
                className="group/marquee relative flex overflow-hidden"
              >
                <div
                  className={clsx(
                    'flex w-max py-1 group-hover/marquee:[animation-play-state:paused]',
                    r % 2 === 0 ? 'animate-marquee-left' : 'animate-marquee-right',
                  )}
                  style={{ ['--marquee-duration' as string]: `${duration}s` }}
                >
                  {/* Two copies of the lane make the -50% loop seamless. */}
                  {[...lane, ...lane].map((p, i) => <Tile key={i} p={p} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 p-5"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-ink shadow-2xl md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={L.close}
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 text-2xl leading-none text-ink/40 transition hover:text-ink"
            >
              ×
            </button>

            <div className="flex items-center gap-4">
              {active.logoUrl && (
                <span className="relative h-16 w-24 shrink-0">
                  <Image src={active.logoUrl} alt={active.name} fill className="object-contain" sizes="96px" />
                </span>
              )}
              <div>
                <h3 className="text-2xl leading-tight">{active.name}</h3>
                {active.country && (
                  <p className="mt-1 text-sm text-ink/55">
                    <span className="font-condensed uppercase tracking-wide text-ink/40">{L.country}: </span>
                    {active.country}
                  </p>
                )}
              </div>
            </div>

            {active.expiry && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1 text-sm">
                <span className="font-condensed uppercase tracking-wide text-ink/45">{L.validUntil}:</span>
                <span className="font-medium">{active.expiry}</span>
              </p>
            )}

            <div className="mt-5">
              <p className="font-condensed text-sm uppercase tracking-widest text-ink/45">{L.cooperation}</p>
              {active.faculties && active.faculties.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {active.faculties.map((f, i) => (
                    <li key={i}>
                      <p className="font-medium text-ink">{f.faculty}</p>
                      {f.programs.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {f.programs.map((prog, j) => (
                            <span key={j} className="rounded-md bg-blue/10 px-2 py-0.5 text-xs text-navy">{prog}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink/55">{L.none}</p>
              )}
            </div>

            {active.url && (
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block font-condensed uppercase tracking-widest text-magenta transition hover:opacity-70"
              >
                {L.visit} →
              </a>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
