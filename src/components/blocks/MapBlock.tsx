import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { MapEmbed } from './map/MapEmbed';

/** Brand accent → hex, mirroring tailwind.config.ts (used for the route + pins). */
const ACCENT_HEX: Record<string, string> = {
  magenta: '#ec008c',
  amber: '#ffbc00',
  cyan: '#54feeb',
  blue: '#3880d0',
  red: '#ed1c24',
  orange: '#f58220',
  green: '#6cb33f',
  yellow: '#fff200',
};

/** Frame height presets (config.height). */
const HEIGHTS: Record<string, string> = {
  sm: '22rem',
  md: '30rem',
  lg: '40rem',
};

interface MapMarkerContent {
  label?: LocaleMap;
  latitude?: number | string;
  longitude?: number | string;
}

interface MapBlockContent {
  heading?: LocaleMap;
  markers?: MapMarkerContent[];
}

/**
 * Interactive location map. Editors add one or more markers (label + coordinates);
 * the block plots numbered pins, optionally connects them with a route line, and
 * auto-fits the viewport to all points. The MapLibre canvas is client-only (see
 * MapEmbed) — this server component just resolves copy/coordinates for the locale.
 */
export function MapBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as MapBlockContent;
  const cfg = block.config;

  const points = (c.markers ?? [])
    .map((m) => ({
      label: t(m.label, locale),
      lat: Number(m.latitude),
      lng: Number(m.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const theme = (cfg.mapStyle as 'light' | 'dark') ?? 'light';
  const accentColor = ACCENT_HEX[(cfg.accent as string) ?? 'blue'] ?? ACCENT_HEX.blue;
  const height = HEIGHTS[(cfg.height as string) ?? 'md'] ?? HEIGHTS.md;
  const zoom = typeof cfg.zoom === 'number' ? cfg.zoom : 11;
  const showRoute = cfg.showRoute !== false;
  const showControls = cfg.showControls !== false;
  const headingLeft = (cfg.layout as string) === 'left';

  // Fallback centre — average of markers (used mainly for the single-marker case;
  // multi-marker maps auto-fit their bounds client-side).
  const center: [number, number] = points.length
    ? [
        points.reduce((s, p) => s + p.lng, 0) / points.length,
        points.reduce((s, p) => s + p.lat, 0) / points.length,
      ]
    : [112.7521, -7.2575]; // Petra / Surabaya

  const onDark = (cfg.background ?? 'paper') === 'navy';

  return (
    <Section config={cfg}>
      <Container>
        {t(c.heading, locale) && (
          <InlineHtml
            as="h2"
            html={t(c.heading, locale)}
            className={clsx('mb-8 text-3xl md:text-4xl', headingLeft ? 'text-left' : 'text-center')}
          />
        )}
        {points.length === 0 ? (
          <EmptyState
            onDark={onDark}
            title={locale === 'id' ? 'Belum ada lokasi' : 'No locations yet'}
            hint={
              locale === 'id'
                ? 'Tambahkan penanda dengan koordinat untuk menampilkannya di peta.'
                : 'Add markers with coordinates to plot them on the map.'
            }
          />
        ) : (
          <div
            className={clsx(
              'overflow-hidden rounded-xl border shadow-sm',
              onDark ? 'border-white/15' : 'border-ink/10',
            )}
            style={{ height }}
          >
            <MapEmbed
              points={points}
              center={center}
              zoom={zoom}
              theme={theme}
              accentColor={accentColor}
              showRoute={showRoute}
              showControls={showControls}
            />
          </div>
        )}
      </Container>
    </Section>
  );
}
