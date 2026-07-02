import type { ComponentType } from 'react';
import type { Block, BlockBaseConfig, Locale } from '@/lib/types';

/** Canonical ordered list of the 23 block types (source of truth for BlockType). */
export const BLOCK_TYPES = [
  // Layout & hero
  'hero',
  'section_header',
  'audience_doors',
  'divider',
  // Content composition
  'rich_text',
  'image_text_split',
  'stat_strip',
  'card_grid',
  'feature_list',
  'accordion',
  'tabs',
  'steps',
  'timeline',
  'gallery',
  'pull_quote',
  'logo_wall',
  'embed',
  'downloads',
  'events',
  // Entity-bound
  'partner_map',
  'partner_marquee',
  'testimonials',
  'news_feed',
  'staff',
  'faculties',
  // Conversion
  'cta_banner',
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

/**
 * Optional conditional visibility. When present, the field only renders in the
 * side panel while `config[field]` equals one of `equals` — this is what lets a
 * single block (e.g. Hero) present a *different* set of options per layout.
 * Kept declarative (data, not a function) so the schema stays serialisable.
 */
export type FieldVisibility = { showFor?: { field: string; equals: string[] } };

/** A single editable field in the live-editor side panel. */
export type EditorField = FieldVisibility & (
  | { key: string; label: string; type: 'text' | 'textarea'; localized?: boolean; help?: string }
  | { key: string; label: string; type: 'richtext'; localized?: boolean }
  // Single-line WYSIWYG for short display copy (headings, labels…). Stores
  // inline HTML (no block wrapper) so it injects into the block's own tag.
  | { key: string; label: string; type: 'richtext-inline'; localized?: boolean; help?: string }
  | { key: string; label: string; type: 'image' }
  | { key: string; label: string; type: 'url'; help?: string }
  | { key: string; label: string; type: 'link'; help?: string }
  | { key: string; label: string; type: 'file'; help?: string }
  | { key: string; label: string; type: 'date'; help?: string }
  | { key: string; label: string; type: 'number'; help?: string }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; default?: string; help?: string }
  // Visual layout picker — like `select`, but rendered as clickable thumbnail
  // previews. `shape` names a diagram in the LayoutField shape map. The chosen
  // value is a plain string, so it can also drive `showFor` visibility.
  | { key: string; label: string; type: 'layout'; options: { value: string; label: string; shape: string }[]; default?: string; help?: string }
  // Pick many fixed options — value is a string[] of the chosen option values.
  | { key: string; label: string; type: 'multiselect'; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: 'entity'; entity: 'staff' | 'programs'; help?: string }
  // Pick many rows of an entity — value is a string[] of the chosen row ids.
  | { key: string; label: string; type: 'entitymulti'; entity: 'staff' | 'programs' | 'faculties' | 'study_programs'; help?: string }
  | { key: string; label: string; type: 'list'; itemFields: EditorField[] }
);

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
