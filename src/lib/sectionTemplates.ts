import type { BlockType } from '@/lib/types';

/** One block in a template — no id/owner/position yet (assigned on insert). */
export type BlockSeed = {
  type: BlockType;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
};

export type SectionTemplate = {
  id: string;
  name: string;
  description: string;
  blocks: BlockSeed[];
};

/**
 * Built-in starter sections shown in the editor's "Templates" tab alongside any
 * admin-saved presets. Each is one or more ready-made blocks with sensible
 * bento sizes, so an editor can drop in a whole arrangement instead of building
 * it block-by-block. Kept in code (no DB rows needed) so the library is never
 * empty. Sizes follow the `WxH` bento convention (see blockSize.ts).
 */
export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'hero-stats',
    name: 'Hero + stats',
    description: 'Centered hero above a 3-up stat strip.',
    blocks: [
      {
        type: 'hero',
        config: { background: 'navy', spacing: 'spacious', layout: 'centered', bgType: 'image', bgSource: 'programs', size: '4x1' },
        content: {
          eyebrow: { en: 'Petra International Office', id: 'Kantor Internasional Petra' },
          heading: { en: 'A headline that sets the scene', id: 'Judul yang membuka cerita' },
          subcopy: { en: 'One or two supporting sentences.', id: 'Satu atau dua kalimat pendukung.' },
          ctas: [],
        },
      },
      {
        type: 'stat_strip',
        config: { background: 'paper', spacing: 'normal', layout: 'row', size: '4x1' },
        content: {
          stats: [
            { value: '', label: { en: 'Partner universities', id: 'Universitas mitra' }, auto: 'partners_international' },
            { value: '', label: { en: 'Programs', id: 'Program' }, auto: 'programs' },
            { value: '30+', label: { en: 'Countries', id: 'Negara' }, auto: 'none' },
          ],
        },
      },
    ],
  },
  {
    id: 'cards-3up',
    name: '3-up card row',
    description: 'A section header and a three-column card grid.',
    blocks: [
      {
        type: 'section_header',
        config: { background: 'paper', spacing: 'normal', size: '4x1' },
        content: {
          heading: { en: 'Section title', id: 'Judul bagian' },
          subcopy: { en: 'A short intro to what follows.', id: 'Pengantar singkat.' },
        },
      },
      {
        type: 'card_grid',
        config: { background: 'paper', spacing: 'normal', layout: 'grid', source: 'manual', columns: 3, linkToPage: true, size: '4x1' },
        content: { cards: [] },
      },
    ],
  },
  {
    id: 'split-cta',
    name: 'Image + text, then CTA',
    description: 'An image/text split followed by a full-width CTA banner.',
    blocks: [
      {
        type: 'image_text_split',
        config: { background: 'paper', spacing: 'normal', imageSide: 'left', size: '4x1' },
        content: { heading: { en: 'Tell the story', id: 'Ceritakan kisahnya' }, body: {}, image_url: '', cta: [] },
      },
      {
        type: 'cta_banner',
        config: { background: 'navy', spacing: 'normal', accent: 'magenta', size: '4x1' },
        content: { heading: { en: 'Ready to get started?', id: 'Siap memulai?' }, ctas: [] },
      },
    ],
  },
  {
    id: 'bento-pair',
    name: 'Bento pair (2×2)',
    description: 'Two half-width tiles side by side — a rich-text and a gallery.',
    blocks: [
      {
        type: 'rich_text',
        config: { background: 'paper', spacing: 'normal', width: 'full', size: '2x2' },
        content: { html: { en: '<p>Half-width copy.</p>', id: '<p>Teks setengah lebar.</p>' } },
      },
      {
        type: 'gallery',
        config: { background: 'paper', spacing: 'normal', layout: 'grid', columns: 2, size: '2x2' },
        content: { images: [] },
      },
    ],
  },
];
