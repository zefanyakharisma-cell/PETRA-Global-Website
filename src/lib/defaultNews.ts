import type { BlockType, LocaleMap } from '@/lib/types';

/** A block ready to insert against a news article (no id/owner yet). */
export type NewsBlockSeed = {
  type: BlockType;
  position: number;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
};

/**
 * Starter block layout dropped onto every newly-created news article, so editors
 * begin from a tidy, on-brand article rather than a blank canvas — then edit,
 * reorder, or delete blocks freely. Composition:
 *   hero (masthead, carries the title) → rich_text (body) → gallery (photos &
 *   video) → news_feed (related stories). Entity-bound blocks show an empty
 *   state until real content exists.
 */
export function defaultNewsBlocks(title: LocaleMap): NewsBlockSeed[] {
  return [
    {
      type: 'hero',
      position: 0,
      config: { background: 'navy', spacing: 'spacious', layout: 'left', bgType: 'none' },
      content: {
        eyebrow: { en: 'News', id: 'Berita' },
        heading: { en: title.en ?? '', id: title.id ?? '' },
        subcopy: {},
        ctas: [],
      },
    },
    {
      type: 'rich_text',
      position: 1,
      config: { background: 'paper', spacing: 'normal', width: 'narrow' },
      content: {
        html: {
          en: '<p>Write the story here. Use headings, lists, quotes, and links to keep it easy to read.</p>',
          id: '<p>Tulis beritanya di sini. Gunakan judul, daftar, kutipan, dan tautan agar mudah dibaca.</p>',
        },
      },
    },
    {
      type: 'gallery',
      position: 2,
      config: { background: 'paper', spacing: 'normal', layout: 'grid', columns: 3 },
      content: { images: [] },
    },
    {
      type: 'news_feed',
      position: 3,
      config: { background: 'paper', spacing: 'normal', layout: 'grid', count: 3 },
      content: { heading: { en: 'Related stories', id: 'Berita terkait' } },
    },
  ];
}
