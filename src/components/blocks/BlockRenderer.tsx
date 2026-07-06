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
  const isEdit = mode === 'edit';

  // Blocks flow in a 4-column bento grid. Each block's `config.size` (WxH)
  // controls how many columns it spans and its height floor; the default of
  // `4x1` makes a block take a full row, reproducing the classic stack.
  // `grid-auto-flow: dense` backfills gaps left by narrower tiles.
  return (
    <div className="grid grid-cols-1 [grid-auto-flow:dense] md:grid-cols-4" data-block-grid={isEdit ? '' : undefined}>
      {blocks
        .slice()
        .sort((a, b) => a.position - b.position)
        // In public rendering a hidden block is skipped entirely; in edit mode
        // it stays visible (dimmed) so it can still be selected and un-hidden.
        .filter((block) => isEdit || !block.config.hidden)
        .map((block) => {
          const def = BLOCK_REGISTRY[block.type];
          if (!def) return null;
          const Component = def.Component;
          const hidden = !!block.config.hidden;
          const locked = !!block.config.locked;
          // Inner `grid` wrapper: its single child (the block's <Section>)
          // stretches to fill the tile's width and height floor. In edit mode
          // it carries data-* hooks the overlay uses to map DOM → block.
          return (
            <div
              key={block.id}
              className={clsx('relative grid', blockTileClasses(block.config), isEdit && hidden && 'opacity-40')}
              data-block-id={isEdit ? block.id : undefined}
              data-block-type={isEdit ? block.type : undefined}
              data-locked={isEdit && locked ? '' : undefined}
              data-hidden={isEdit && hidden ? '' : undefined}
            >
              {isEdit && hidden && (
                <span className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  Hidden
                </span>
              )}
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
