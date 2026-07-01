import { BLOCK_REGISTRY } from './registry';
import { blockTileClasses } from './blockSize';
import { clsx } from '@/lib/clsx';
import type { Block, Locale } from '@/lib/types';
import type { BlockRenderMode } from './registry.types';

/**
 * Renders an ordered block sequence by mapping each `type` → component via the
 * registry. The SAME renderer drives the public page and the live editor
 * (editing affordances toggle on `mode`). Unknown types are skipped safely.
 */
export function BlockRenderer({
  blocks,
  locale,
  mode = 'public',
  pageOwnerStaffId,
}: {
  blocks: Block[];
  locale: Locale;
  mode?: BlockRenderMode;
  pageOwnerStaffId?: string | null;
}) {
  // Blocks flow in a 4-column bento grid. Each block's `config.size` (WxH)
  // controls how many columns it spans and its height floor; the default of
  // `4x1` makes a block take a full row, reproducing the classic stack.
  // `grid-auto-flow: dense` backfills gaps left by narrower tiles.
  return (
    <div className="grid grid-cols-1 [grid-auto-flow:dense] md:grid-cols-4">
      {blocks
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((block) => {
          const def = BLOCK_REGISTRY[block.type];
          if (!def) return null;
          const Component = def.Component;
          // Inner `grid` wrapper: its single child (the block's <Section>)
          // stretches to fill the tile's width and height floor.
          return (
            <div key={block.id} className={clsx('grid', blockTileClasses(block.config))}>
              <Component
                block={block}
                locale={locale}
                mode={mode}
                pageOwnerStaffId={pageOwnerStaffId}
              />
            </div>
          );
        })}
    </div>
  );
}
