import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
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
export async function PartnerMapBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as PartnerMapContent;
  const supabase = await createClient();

  let query = supabase
    .from('partners')
    .select('name,country,lat,lng,kind,region,url')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const filterKind = block.config.filterKind as string | undefined;
  if (filterKind === 'international' || filterKind === 'domestic') {
    query = query.eq('kind', filterKind);
  }

  const { data } = await query;
  const markers = (data ?? []) as PartnerMarker[];

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
          <PartnerMapLoader markers={markers} defaultZoom={Number(block.config.defaultZoom ?? 1)} />
        )}
      </Container>
    </Section>
  );
}
