import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { Car, Footprints, Bus, Bike, ArrowRight, MapPin, ExternalLink } from 'lucide-react';

/** Frame height presets (config.height), mirroring MapBlock. */
const HEIGHTS: Record<string, string> = { sm: '22rem', md: '30rem', lg: '40rem' };

/** Travel mode → Google `dirflg`, the deep-link `travelmode`, and a label + icon. */
const MODES: Record<string, { flag: string; travelmode: string; label: string; Icon: typeof Car }> = {
  driving: { flag: 'd', travelmode: 'driving', label: 'Driving', Icon: Car },
  walking: { flag: 'w', travelmode: 'walking', label: 'Walking', Icon: Footprints },
  transit: { flag: 'r', travelmode: 'transit', label: 'Public transit', Icon: Bus },
  bicycling: { flag: 'b', travelmode: 'bicycling', label: 'Bicycling', Icon: Bike },
};

interface DirectionsContent {
  heading?: LocaleMap;
  origin?: string;
  destination?: string;
  originLabel?: LocaleMap;
  destLabel?: LocaleMap;
}

/**
 * Navigation / directions block. Shows the route from one place to another via a
 * keyless Google Maps directions embed (no API key needed — Google's frame draws
 * the route and shows travel time), wrapped in an origin → destination route card
 * (adapted from the 21st.dev "Route Planner Card"). A deep link opens the full
 * turn-by-turn directions in Google Maps.
 */
export function DirectionsBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as DirectionsContent;
  const cfg = block.config;

  const origin = (c.origin ?? '').trim();
  const destination = (c.destination ?? '').trim();
  const onDark = (cfg.background ?? 'paper') === 'navy';
  const layout = (cfg.layout as string) ?? 'split';
  const height = HEIGHTS[(cfg.height as string) ?? 'md'] ?? HEIGHTS.md;
  const mode = MODES[(cfg.travelMode as string) ?? 'driving'] ?? MODES.driving;

  const heading = t(c.heading, locale);
  const originName = t(c.originLabel, locale) || origin;
  const destName = t(c.destLabel, locale) || destination;

  if (!origin || !destination) {
    return (
      <Section config={cfg}>
        <Container>
          {heading && <InlineHtml as="h2" html={heading} className="mb-8 text-3xl md:text-4xl" />}
          <EmptyState
            onDark={onDark}
            title={locale === 'id' ? 'Rute belum diatur' : 'No route set'}
            hint={locale === 'id' ? 'Isikan lokasi asal dan tujuan pada opsi blok.' : 'Set an origin and destination in the block options.'}
          />
        </Container>
      </Section>
    );
  }

  const embedUrl =
    `https://www.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&dirflg=${mode.flag}&output=embed`;
  const deepLink =
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode.travelmode}`;

  const mapOnly = layout === 'map';
  const stacked = layout === 'stacked';

  const mapFrame = (
    <div
      className={clsx('overflow-hidden rounded-xl border shadow-sm', onDark ? 'border-white/15' : 'border-ink/10')}
      style={{ height }}
    >
      <iframe
        title={`Directions from ${originName} to ${destName}`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      />
    </div>
  );

  const card = (
    <div
      className={clsx(
        'flex flex-col gap-5 rounded-xl border p-6 shadow-sm',
        onDark ? 'border-white/15 bg-white/5 text-white' : 'border-ink/10 bg-white text-ink',
        stacked && 'sm:flex-row sm:items-center sm:justify-between sm:gap-8',
      )}
    >
      {/* Origin → destination */}
      <div className={clsx('min-w-0', stacked && 'flex-1')}>
        <div className={clsx('mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide', onDark ? 'text-white/60' : 'text-ink/50')}>
          <mode.Icon className="h-3.5 w-3.5" aria-hidden />
          {mode.label}
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className={clsx('mt-1.5 size-2.5 shrink-0 rounded-full ring-2', onDark ? 'bg-cyan ring-cyan/30' : 'bg-blue ring-blue/25')} aria-hidden />
            <div className="min-w-0">
              <div className={clsx('text-[11px] uppercase tracking-wide', onDark ? 'text-white/50' : 'text-ink/40')}>From</div>
              <div className="truncate font-medium">{originName}</div>
            </div>
          </div>
          <div className={clsx('ml-[4px] h-4 w-px', onDark ? 'bg-white/20' : 'bg-ink/15')} aria-hidden />
          <div className="flex items-start gap-2">
            <MapPin className={clsx('mt-0.5 size-3.5 shrink-0', onDark ? 'text-magenta' : 'text-magenta')} aria-hidden />
            <div className="min-w-0">
              <div className={clsx('text-[11px] uppercase tracking-wide', onDark ? 'text-white/50' : 'text-ink/40')}>To</div>
              <div className="truncate font-medium">{destName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Open in Google Maps */}
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
          onDark ? 'bg-cyan text-navy hover:bg-cyan/90' : 'bg-navy text-white hover:bg-navy-2',
          stacked ? 'shrink-0' : 'w-full',
        )}
      >
        {locale === 'id' ? 'Buka di Google Maps' : 'Open in Google Maps'}
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </div>
  );

  return (
    <Section config={cfg}>
      <Container>
        {heading && <InlineHtml as="h2" html={heading} className="mb-8 text-3xl md:text-4xl" />}
        {mapOnly ? (
          <>
            {mapFrame}
            <div className="mt-4">
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx('inline-flex items-center gap-2 text-sm font-medium', onDark ? 'text-cyan hover:text-cyan/80' : 'text-navy hover:text-navy-2')}
              >
                <mode.Icon className="size-4" aria-hidden />
                {originName} <ArrowRight className="size-3.5" aria-hidden /> {destName}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </>
        ) : stacked ? (
          <div className="space-y-6">{card}{mapFrame}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:items-stretch">
            {card}
            {mapFrame}
          </div>
        )}
      </Container>
    </Section>
  );
}
