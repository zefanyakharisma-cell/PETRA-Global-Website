import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Section, Container } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from '@/components/ui/Reveal';
import { createClient } from '@/lib/supabase/server';
import { localeAlternates } from '@/lib/seo';
import { clsx } from '@/lib/clsx';

export const revalidate = 60;

interface PartnerRow {
  name: string;
  country: string | null;
  region: string | null;
  url: string | null;
}

/** Display order + bilingual labels for the regions used by the seeded data. */
const REGION_ORDER = ['Asia', 'Europe', 'North America', 'Oceania', 'Middle East'] as const;
const REGION_LABEL: Record<string, { en: string; id: string }> = {
  Asia: { en: 'Asia', id: 'Asia' },
  Europe: { en: 'Europe', id: 'Eropa' },
  'North America': { en: 'North America', id: 'Amerika Utara' },
  Oceania: { en: 'Oceania', id: 'Oseania' },
  'Middle East': { en: 'Middle East', id: 'Timur Tengah' },
};

const COPY = {
  en: {
    title: 'Partnership',
    intro:
      'Petra Christian University collaborates with universities, institutions, and industry partners across the globe through Memoranda of Understanding and Agreement.',
    partners: 'partners',
    countries: 'countries',
    regions: 'regions',
    other: 'Other',
    emptyTitle: 'No partners published yet',
    emptyHint: 'Partner institutions will appear here once they are added.',
  },
  id: {
    title: 'Kemitraan',
    intro:
      'Universitas Kristen Petra menjalin kerja sama dengan universitas, institusi, dan mitra industri di seluruh dunia melalui Nota Kesepahaman dan Kesepakatan.',
    partners: 'mitra',
    countries: 'negara',
    regions: 'kawasan',
    other: 'Lainnya',
    emptyTitle: 'Belum ada mitra',
    emptyHint: 'Institusi mitra akan tampil di sini setelah ditambahkan.',
  },
} as const;

async function getPartners(): Promise<PartnerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('partners')
    .select('name,country,region,url')
    .eq('kind', 'international')
    .order('name');
  return (data ?? []) as PartnerRow[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'id' ? 'id' : 'en';
  const copy = COPY[loc];
  return {
    title: copy.title,
    description: copy.intro,
    alternates: localeAlternates(loc, '/partnership'),
  };
}

export default async function PartnershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale === 'id' ? 'id' : 'en';
  const copy = COPY[loc];

  const partners = await getPartners();

  // Group by region (preserving the curated order; unknowns fall under "Other").
  const byRegion = new Map<string, PartnerRow[]>();
  for (const p of partners) {
    const region = p.region && REGION_LABEL[p.region] ? p.region : '__other';
    const list = byRegion.get(region) ?? [];
    list.push(p);
    byRegion.set(region, list);
  }
  const regions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...(byRegion.has('__other') ? (['__other'] as const) : []),
  ];

  const countryCount = new Set(partners.map((p) => p.country).filter(Boolean)).size;
  const regionCount = regions.filter((r) => r !== '__other').length;

  return (
    <>
      <Section as="header" config={{ background: 'navy', spacing: 'spacious' }}>
        <Container>
          <p className="font-condensed uppercase tracking-widest text-cyan">{copy.title}</p>
          <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl">{copy.intro}</h1>

          {partners.length > 0 && (
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {[
                [partners.length, copy.partners],
                [countryCount, copy.countries],
                [regionCount, copy.regions],
              ].map(([value, label]) => (
                <div key={label as string}>
                  <dt className="text-4xl font-semibold md:text-5xl">{value}</dt>
                  <dd className="mt-1 font-condensed uppercase tracking-widest text-white/60">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Container>
      </Section>

      <Section config={{ background: 'paper', spacing: 'normal' }}>
        <Container>
          {partners.length === 0 ? (
            <EmptyState title={copy.emptyTitle} hint={copy.emptyHint} />
          ) : (
            <div className="space-y-16">
              {regions.map((region) => {
                const list = byRegion.get(region) ?? [];
                const label =
                  region === '__other' ? copy.other : REGION_LABEL[region][loc];
                return (
                  <Reveal key={region}>
                    <section>
                      <div className="flex items-baseline justify-between border-b border-ink/10 pb-3">
                        <h2 className="text-3xl md:text-4xl">{label}</h2>
                        <span className="font-condensed text-sm uppercase tracking-widest text-ink/50">
                          {list.length} {copy.partners}
                        </span>
                      </div>
                      <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {list.map((p, i) => (
                          <li key={`${p.name}-${i}`}>
                            <PartnerItem partner={p} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  </Reveal>
                );
              })}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

function PartnerItem({ partner }: { partner: PartnerRow }) {
  const inner = (
    <>
      <span
        className={clsx(
          'block font-medium text-ink',
          partner.url && 'transition group-hover:text-magenta',
        )}
      >
        {partner.name}
      </span>
      {partner.country && <span className="mt-0.5 block text-sm text-ink/55">{partner.country}</span>}
    </>
  );

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block border-l-2 border-ink/10 pl-3 transition hover:border-magenta"
      >
        {inner}
      </a>
    );
  }
  return <div className="border-l-2 border-ink/10 pl-3">{inner}</div>;
}
