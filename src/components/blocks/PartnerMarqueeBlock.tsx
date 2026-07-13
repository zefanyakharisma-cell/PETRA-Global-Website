import { createClient } from '@/lib/supabase/server';
import { t, type LocaleMap } from '@/lib/types';
import { partnerLogo } from '@/lib/partnerLogos';
import { normalizePartnerName } from '@/lib/partnerLogoMatch';
import type { BlockComponentProps } from './registry.types';
import { PartnerMarquee, type MarqueePartner } from './partner-marquee/PartnerMarquee';

interface PartnerMarqueeContent {
  heading?: LocaleMap;
}

/**
 * Curated "popularity" weights for the international marquee. Keys are the
 * normalized institution name (same matcher as the logos). A weight of N makes
 * that partner's tile appear N times in the scroll, so the most globally
 * recognizable partners recur more often; everything else defaults to 1.
 * Edit here to promote/demote a partner.
 */
const POPULAR_WEIGHT: Record<string, number> = {
  'national university of singapore': 3,
  'yonsei university': 3,
  'city university of hong kong': 3,
  'monash university': 3,
  'school of economics fudan university': 3,
  'xiamen university': 3,
  'singapore management university': 2,
  'singapore university of technology and design': 2,
  'macquarie university': 2,
  'queensland university of technology': 2,
  'university of tasmania': 2,
  'swinburne university of technology': 2,
  'coventry university': 2,
  'sophia university': 2,
  'pusan national university': 2,
  'hankuk university of foreign studies': 2,
  'national central university': 2,
  'national sun yat sen university': 2,
  'national taiwan university of science and technology': 2,
  'xi an jiatong liverpool university': 2,
  'universiti sains malaysia': 2,
  'vellore institute of technology': 2,
  'james cook university': 2,
  'ngee ann polytechnic': 2,
  'lingnan university': 2,
};

/**
 * International partners carry their country directly on petra_io.partners.
 * Only partners with a logo are shown (admin upload, or a match in the bundled
 * logo manifest) — the marquee is a wall of recognizable logos. Curated
 * "popular" partners recur more often via POPULAR_WEIGHT.
 */
async function internationalLogos(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<MarqueePartner[]> {
  const { data } = await supabase
    .from('partners')
    .select('name,country,logo_url,url')
    .eq('kind', 'international')
    .order('name');
  return (data ?? [])
    .map((r) => ({
      name: r.name,
      country: r.country,
      // An admin-uploaded logo_url wins; otherwise fall back to the bundled logo
      // manifest matched by institution name (public/partners/*).
      logoUrl: r.logo_url ?? partnerLogo(r.name),
      url: r.url,
    }))
    .filter((p) => p.logoUrl) // logo-only wall — drop partners without a logo
    // Repeat popular partners so they appear more often across the lanes.
    .flatMap((p) => Array.from(
      { length: POPULAR_WEIGHT[normalizePartnerName(p.name)] ?? 1 },
      () => p,
    ));
}

/**
 * Domestic partners live in petra_io.domestic_partners, keyed by city. Only the
 * ones with a logo are shown — the marquee is a wall of recognizable brand logos
 * (seeded by supabase/seed-domestic-partner-logos.ts), not the full text list.
 */
async function domesticLogos(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<MarqueePartner[]> {
  const { data } = await supabase
    .from('domestic_partners')
    .select('name,city,logo_url,url')
    .not('logo_url', 'is', null)
    .order('name');
  return (data ?? []).map((r) => ({
    name: r.name,
    country: r.city,
    logoUrl: r.logo_url ?? partnerLogo(r.name),
    url: r.url,
  }));
}

/**
 * Scrolling rows of partner logos pulled straight from the database. The
 * `filterKind` config chooses the network shown — international, domestic, or
 * both. Partners with a logo show it; those without render a text tile. Each
 * tile opens a detail popup (rendered by the shared client <PartnerMarquee>).
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
