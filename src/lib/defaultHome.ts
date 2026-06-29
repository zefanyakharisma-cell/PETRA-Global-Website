import type { Block } from '@/lib/types';

/**
 * Built-in default home composition, used only when no `home` page is published
 * in the CMS yet. Mirrors the sitemap: hero → audience_doors (3) → stat_strip →
 * card_grid (featured programs) → partner_map (teaser) → testimonials →
 * news_feed → inquiry_form (CTA band). Entity-bound blocks show empty states
 * until content is seeded (per the brief: do not seed real content).
 */
export function defaultHomeBlocks(): Block[] {
  const mk = (
    type: Block['type'],
    position: number,
    config: Block['config'],
    content: Record<string, unknown> = {},
  ): Block => ({
    id: `default-${type}-${position}`,
    page_id: 'default-home',
    type,
    position,
    config,
    content,
  });

  return [
    mk('hero', 0, { background: 'navy', spacing: 'spacious', layout: 'centered' }, {
      eyebrow: { en: 'Petra Christian University · International Office', id: 'Universitas Kristen Petra · International Office' },
      heading: { en: 'A caring and global university.', id: 'Universitas yang peduli dan global.' },
      subcopy: {
        en: 'Your front door to studying at Petra, partnering with us, and going abroad — since 1961, in the heart of Surabaya.',
        id: 'Pintu masuk untuk belajar di Petra, bermitra dengan kami, dan ke luar negeri — sejak 1961, di jantung kota Surabaya.',
      },
      ctas: [
        { label: { en: 'Explore programs', id: 'Jelajahi program' }, href: '/mobility', variant: 'magenta' },
        { label: { en: 'Partner with us', id: 'Bermitra dengan kami' }, href: '/partnership', variant: 'outline' },
      ],
    }),
    mk('audience_doors', 1, { background: 'paper', spacing: 'normal' }, {
      doors: [
        { accent: 'magenta', title: { en: 'Study at Petra', id: 'Belajar di Petra' }, blurb: { en: 'Thinking about a semester in Surabaya? Here’s how it works.', id: 'Memikirkan satu semester di Surabaya? Begini caranya.' }, href: '/mobility' },
        { accent: 'blue', title: { en: 'Partner with Petra', id: 'Bermitra dengan Petra' }, blurb: { en: 'Build exchange, joint degrees, and Tailor-Made Programs with us.', id: 'Bangun pertukaran, gelar bersama, dan Tailor-Made Program bersama kami.' }, href: '/partnership' },
        { accent: 'amber', title: { en: 'Go abroad', id: 'Ke luar negeri' }, blurb: { en: 'Petra students — start your journey beyond campus.', id: 'Mahasiswa Petra — mulai perjalananmu ke luar kampus.' }, href: '/mobility' },
      ],
    }),
    mk('stat_strip', 2, { background: 'navy', spacing: 'normal' }, {
      stats: [
        { value: '60+', label: { en: 'Years since 1961', id: 'Tahun sejak 1961' }, auto: 'none' },
        { value: '7', label: { en: 'Faculties', id: 'Fakultas' }, auto: 'none' },
        { auto: 'partners', label: { en: 'Global partners', id: 'Mitra global' } },
        { auto: 'programs', label: { en: 'Programs', id: 'Program' } },
      ],
    }),
    mk('card_grid', 3, { background: 'paper', spacing: 'normal', source: 'programs', columns: 3 }, {}),
    mk('partner_map', 4, { background: 'navy', spacing: 'normal', filterKind: 'all', defaultZoom: 1 }, {
      heading: { en: 'Our global network', id: 'Jaringan global kami' },
    }),
    mk('testimonials', 5, { background: 'navy', spacing: 'normal', layout: 'grid' }, {}),
    mk('news_feed', 6, { background: 'paper', spacing: 'normal', count: 3 }, {
      heading: { en: 'Latest from Petra', id: 'Terbaru dari Petra' },
    }),
    mk('inquiry_form', 7, { background: 'navy', spacing: 'spacious', preset: 'student' }, {
      heading: { en: 'Start a conversation', id: 'Mulai percakapan' },
      intro: { en: 'Tell us what you’re looking for and we’ll point you to the right person.', id: 'Beri tahu kami kebutuhan Anda dan kami akan arahkan ke orang yang tepat.' },
    }),
  ];
}
