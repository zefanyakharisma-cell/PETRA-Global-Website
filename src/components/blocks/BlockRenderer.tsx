import { BLOCK_REGISTRY } from './registry';
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
  return (
    <>
      {blocks
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((block) => {
          const def = BLOCK_REGISTRY[block.type];
          if (!def) return null;
          const Component = def.Component;
          return (
            <Component
              key={block.id}
              block={block}
              locale={locale}
              mode={mode}
              pageOwnerStaffId={pageOwnerStaffId}
            />
          );
        })}
    </>
  );
}
