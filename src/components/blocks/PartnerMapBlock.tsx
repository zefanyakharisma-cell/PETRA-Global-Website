import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { cityToCoords } from '@/lib/cityCoords';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { PartnerWorldMapLoader } from './partner-map/PartnerWorldMapLoader';
import type { WorldMapDot } from '@/components/ui/world-map';

interface PartnerMapContent {
  heading?: LocaleMap;
}

/** Petra Christian University — Surabaya. Every arc radiates from here. */
const PETRA = { lat: -7.2575, lng: 112.7521 } as const;

/** Indonesia bounding box used to zoom the domestic dotted map. */
const INDONESIA_REGION = { lat: { min: -11, max: 6 }, lng: { min: 95, max: 141 } } as const;

/**
 * Collapse the (160+ international / 450+ domestic) partner rows into one arc
 * per destination so the animated map stays legible. International partners are
 * grouped by country (arc lands on the country's average coordinate); domestic
 * partners are grouped by city. The label carries the partner count.
 */
function buildDots(markers: PartnerMarker[]): WorldMapDot[] {
  const groups = new Map<string, { sumLat: number; sumLng: number; n: number }>();
  for (const m of markers) {
    const key = (m.country ?? '').trim() || 'Other';
    const g = groups.get(key) ?? { sumLat: 0, sumLng: 0, n: 0 };
    g.sumLat += m.lat;
    g.sumLng += m.lng;
    g.n += 1;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .map(([label, g]) => ({
      start: { ...PETRA, label: '★ Petra (Surabaya)' },
      end: {
        lat: g.sumLat / g.n,
        lng: g.sumLng / g.n,
        label: `${label} (${g.n})`,
      },
    }));
}

export interface PartnerMarker {
  name: string;
  country: string | null;
  lat: number;
  lng: number;
  kind: 'international' | 'domestic';
  region: string | null;
  url: string | null;
}

/**
 * Signature feature (goal #5): an animated dotted world map plotting the
 * partner network as arcs radiating from Petra (Surabaya). Rendering lives in
 * the client `WorldMap` (see PartnerWorldMapLoader); this server component only
 * fetches + aggregates the partner rows.
 */
/** International partners carry lat/lng directly on petra_io.partners. */
async function internationalMarkers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PartnerMarker[]> {
  const { data } = await supabase
    .from('partners')
    .select('name,country,lat,lng,kind,region,url')
    .eq('kind', 'international')
    .not('lat', 'is', null)
    .not('lng', 'is', null);
  return (data ?? []) as PartnerMarker[];
}

/**
 * Domestic partners live in petra_io.domestic_partners and are positioned by
 * their City (resolved to coordinates via cityToCoords). Rows whose city is
 * blank or unmapped are skipped.
 */
async function domesticMarkers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PartnerMarker[]> {
  const { data } = await supabase.from('domestic_partners').select('name,city,region,url');
  const markers: PartnerMarker[] = [];
  for (const r of data ?? []) {
    const coords = cityToCoords(r.city);
    if (!coords) continue;
    markers.push({
      name: r.name,
      country: r.city, // tooltip shows the city for domestic partners
      lat: coords.lat,
      lng: coords.lng,
      kind: 'domestic',
      region: r.region,
      url: r.url,
    });
  }
  return markers;
}

export async function PartnerMapBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as PartnerMapContent;
  const supabase = await createClient();

  const filterKind = block.config.filterKind as string | undefined;
  let markers: PartnerMarker[];
  if (filterKind === 'domestic') {
    markers = await domesticMarkers(supabase);
  } else if (filterKind === 'international') {
    markers = await internationalMarkers(supabase);
  } else {
    markers = [...(await internationalMarkers(supabase)), ...(await domesticMarkers(supabase))];
  }

  const dots = buildDots(markers);
  const isDomestic = filterKind === 'domestic';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container>
        {c.heading && <h2 className="mb-8 text-center text-3xl md:text-4xl">{t(c.heading, locale)}</h2>}
        {dots.length === 0 ? (
          <EmptyState
            onDark
            title={locale === 'id' ? 'Belum ada mitra dipetakan' : 'No partners mapped yet'}
            hint={locale === 'id' ? 'Mitra dengan koordinat akan muncul di peta.' : 'Partners with coordinates will plot here.'}
          />
        ) : (
          // Both networks render as animated arcs radiating from Petra. The
          // domestic map zooms the dotted canvas to the Indonesian archipelago.
          <PartnerWorldMapLoader
            dots={dots}
            region={isDomestic ? INDONESIA_REGION : undefined}
            loop={!isDomestic}
          />
        )}
      </Container>
    </Section>
  );
}
