import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { cityToCoords } from '@/lib/cityCoords';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { PartnerMapLoader } from './partner-map/PartnerMapLoader';

interface PartnerMapContent {
  heading?: LocaleMap;
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
 * Signature feature (goal #5): interactive world map plotting the partner
 * network. The heavy map runtime is code-split out of the public bundle via
 * next/dynamic(ssr:false) inside PartnerMapLoader.
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

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container>
        {c.heading && <h2 className="mb-8 text-center text-3xl md:text-4xl">{t(c.heading, locale)}</h2>}
        {markers.length === 0 ? (
          <EmptyState
            onDark
            title={locale === 'id' ? 'Belum ada mitra dipetakan' : 'No partners mapped yet'}
            hint={locale === 'id' ? 'Mitra dengan koordinat akan muncul di peta.' : 'Partners with coordinates will plot here.'}
          />
        ) : (
          <PartnerMapLoader
            markers={markers}
            defaultZoom={Number(block.config.defaultZoom ?? (filterKind === 'domestic' ? 3 : 1))}
            center={
              (block.config.center as [number, number] | undefined) ??
              (filterKind === 'domestic' ? [118, -2] : undefined)
            }
          />
        )}
      </Container>
    </Section>
  );
}
