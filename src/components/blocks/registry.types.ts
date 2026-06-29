import type { ComponentType } from 'react';
import type { Block, BlockBaseConfig, Locale } from '@/lib/types';

/** Canonical ordered list of the 18 block types (source of truth for BlockType). */
export const BLOCK_TYPES = [
  // Layout & hero
  'hero',
  'section_header',
  'audience_doors',
  // Content composition
  'rich_text',
  'image_text_split',
  'stat_strip',
  'card_grid',
  'accordion',
  'steps',
  'gallery',
  'pull_quote',
  'logo_wall',
  'embed',
  // Entity-bound
  'partner_map',
  'testimonials',
  'news_feed',
  'staff',
  // Conversion
  'inquiry_form',
] as const;

export type BlockRenderMode = 'public' | 'edit';

export interface BlockComponentProps {
  block: Block;
  locale: Locale;
  mode: BlockRenderMode;
  /** Page-level context — e.g. the staff block's single-mode default owner. */
  pageOwnerStaffId?: string | null;
}

/** A single editable field in the live-editor side panel. */
export type EditorField =
  | { key: string; label: string; type: 'text' | 'textarea'; localized?: boolean; help?: string }
  | { key: string; label: string; type: 'richtext'; localized?: boolean }
  | { key: string; label: string; type: 'image' }
  | { key: string; label: string; type: 'url' }
  | { key: string; label: string; type: 'number' }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'entity'; entity: 'staff' | 'programs'; help?: string }
  | { key: string; label: string; type: 'list'; itemFields: EditorField[] };

export interface EditorSchema {
  /** Fields bound to block.config (layout/source options). */
  config: EditorField[];
  /** Fields bound to block.content (the editable copy/data). */
  content: EditorField[];
}

/**
 * Block metadata — everything the editor + actions need WITHOUT importing the
 * (server) components. Keeping this component-free is what lets client code and
 * 'use server' action files reference the registry without dragging server
 * components across the layer boundary (which breaks Next's action bundling).
 */
export interface BlockMeta {
  type: (typeof BLOCK_TYPES)[number];
  label: string;
  /** Grouping shown in the block picker. */
  category: 'Layout & hero' | 'Content' | 'Entity-bound' | 'Conversion';
  editor: EditorSchema;
  defaultConfig: BlockBaseConfig;
  defaultContent: Record<string, unknown>;
}

export interface BlockDefinition extends BlockMeta {
  Component: ComponentType<BlockComponentProps>;
}
