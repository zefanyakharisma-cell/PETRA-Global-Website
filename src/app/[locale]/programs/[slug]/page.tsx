import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { createClient } from '@/lib/supabase/server';
import { localeAlternates } from '@/lib/seo';
import { t, type Block, type Locale, type LocaleMap } from '@/lib/types';

export const revalidate = 60;

async function getProgram(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('programs')
    .select('id,slug,kind,title,summary,cost,duration,owner_staff_id,cover_url')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const program = await getProgram(slug);
  if (!program) return {};
  return {
    title: t(program.title as LocaleMap, locale as Locale),
    description: t(program.summary as LocaleMap, locale as Locale),
    alternates: localeAlternates(locale as Locale, `/programs/${slug}`),
  };
}

/**
 * Reusable inbound/outbound program anatomy, composed from the same block
 * components the CMS uses. Outbound is the stripped variant (outbound inquiry
 * preset, no "Apply via Admissions" link).
 */
export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const program = await getProgram(slug);
  if (!program) notFound();

  const isInbound = program.kind === 'inbound';
  const cost = program.cost as LocaleMap;
  const mk = (type: Block['type'], position: number, config: Block['config'], content: Record<string, unknown> = {}): Block => ({
    id: `prog-${type}-${position}`,
    page_id: program.id,
    type,
    position,
    config,
    content,
  });

  const blocks: Block[] = [
    mk('hero', 0, { background: 'navy', spacing: 'spacious', layout: program.cover_url ? 'split-with-image' : 'centered' }, {
      eyebrow: { en: isInbound ? 'Study at Petra' : 'Go abroad', id: isInbound ? 'Belajar di Petra' : 'Ke luar negeri' },
      heading: program.title,
      subcopy: program.summary,
      image_url: program.cover_url ?? undefined,
    }),
    mk('rich_text', 1, { background: 'paper', spacing: 'normal', width: 'narrow' }, {
      html: {
        en: `<p>${t(program.summary as LocaleMap, 'en')}</p>`,
        id: `<p>${t(program.summary as LocaleMap, 'id')}</p>`,
      },
    }),
    ...(t(cost, locale as Locale) || program.duration
      ? [mk('stat_strip', 2, { background: 'navy', spacing: 'compact' }, {
          stats: [
            ...(t(cost, locale as Locale) ? [{ value: t(cost, locale as Locale), label: { en: 'Cost', id: 'Biaya' }, auto: 'none' }] : []),
            ...(program.duration ? [{ value: program.duration, label: { en: 'Duration', id: 'Durasi' }, auto: 'none' }] : []),
          ],
        })]
      : []),
    mk('steps', 3, { background: 'paper', spacing: 'normal', orientation: 'vertical' }, {
      heading: { en: 'How to apply', id: 'Cara mendaftar' },
      steps: [],
    }),
    mk('inquiry_form', 4, { background: 'navy', spacing: 'spacious', preset: isInbound ? 'student' : 'outbound', programId: program.id }, {
      heading: { en: 'Interested? Let’s talk', id: 'Tertarik? Mari bicara' },
    }),
    mk('staff', 5, { background: 'paper', spacing: 'normal', mode: 'single' }, {}),
    mk('news_feed', 6, { background: 'paper', spacing: 'normal', count: 3, tag: isInbound ? 'inbound' : 'outbound' }, {
      heading: { en: 'Related news', id: 'Berita terkait' },
    }),
  ];

  return <BlockRenderer blocks={blocks} locale={locale as Locale} pageOwnerStaffId={program.owner_staff_id} />;
}
