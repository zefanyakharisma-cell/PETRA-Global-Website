import { createClient } from '@/lib/supabase/server';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { PartnerMarquee, type MarqueePartner } from './partner-marquee/PartnerMarquee';

interface PartnerMarqueeContent {
  heading?: LocaleMap;
}

/** International partners carry their country directly on petra_io.partners. */
async function internationalLogos(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<MarqueePartner[]> {
  const { data } = await supabase
    .from('partners')
    .select('name,country,logo_url,url')
    .eq('kind', 'international')
    .not('logo_url', 'is', null);
  return (data ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    logoUrl: r.logo_url as string,
    url: r.url,
  }));
}

/** Domestic partners live in petra_io.domestic_partners, keyed by city. */
async function domesticLogos(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<MarqueePartner[]> {
  const { data } = await supabase
    .from('domestic_partners')
    .select('name,city,logo_url,url')
    .not('logo_url', 'is', null);
  return (data ?? []).map((r) => ({
    name: r.name,
    country: r.city,
    logoUrl: r.logo_url as string,
    url: r.url,
  }));
}

/**
 * Scrolling rows of partner logos pulled straight from the database. The
 * `filterKind` config chooses the network shown — international, domestic, or
 * both. Only partners with an uploaded logo appear. Each logo opens a detail
 * popup (rendered by the shared client <PartnerMarquee>).
 */
export async function PartnerMarqueeBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as PartnerMarqueeContent;
  const supabase = await createClient();

  const filterKind = block.config.filterKind as string | undefined;
  let partners: MarqueePartner[];
  if (filterKind === 'domestic') {
    partners = await domesticLogos(supabase);
  } else if (filterKind === 'international') {
    partners = await internationalLogos(supabase);
  } else {
    partners = [...(await internationalLogos(supabase)), ...(await domesticLogos(supabase))];
  }

  if (partners.length === 0) return null;

  return (
    <PartnerMarquee
      partners={partners}
      heading={c.heading ? t(c.heading, locale) : undefined}
      config={block.config}
      locale={locale}
    />
  );
}
