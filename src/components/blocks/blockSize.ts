import type { BlockBaseConfig } from '@/lib/types';

/**
 * Block sizing for the bento grid. Every block declares a `size` of the form
 * `WxH` where W = columns spanned (1–4 of a 4-column grid) and H = height units.
 * The default is `4x1` (full width, natural height) so a page of un-sized blocks
 * renders as the classic full-width vertical stack.
 *
 * Class strings are written as literals so Tailwind's JIT scanner detects them —
 * never build these dynamically (e.g. `md:col-span-${w}` would not be generated).
 */
const COL: Record<string, string> = {
  '1': 'md:col-span-1',
  '2': 'md:col-span-2',
  '3': 'md:col-span-3',
  '4': 'md:col-span-4',
};

// Height units → a min-height floor (md+ only; mobile is always natural height).
// H=1 imposes no floor so full-width single-row blocks keep their intrinsic size.
const MIN_H: Record<string, string> = {
  '1': '',
  '2': 'md:min-h-[24rem]',
  '3': 'md:min-h-[34rem]',
  '4': 'md:min-h-[44rem]',
};

export const BLOCK_SIZE_DEFAULT = '4x1';

/** Parse a `WxH` size string, falling back to the full-width default. */
export function parseBlockSize(size: unknown): { w: string; h: string } {
  const m = typeof size === 'string' ? /^([1-4])x([1-4])$/.exec(size) : null;
  return { w: m?.[1] ?? '4', h: m?.[2] ?? '1' };
}

/** Grid-item classes (column span + height floor) for a block's outer tile. */
export function blockTileClasses(config: BlockBaseConfig): string {
  const { w, h } = parseBlockSize(config.size);
  return [COL[w], MIN_H[h]].filter(Boolean).join(' ');
}
