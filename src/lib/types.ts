/** Shared domain + CMS types. */

import type { BLOCK_TYPES } from '@/components/blocks/registry.types';

/** Translatable field shape. Extensible to `zh` without a schema change. */
export type LocaleMap = {
  en?: string;
  id?: string;
  zh?: string;
};

export type Locale = 'en' | 'id' | 'zh';

/** Resolve a locale map to a string, falling back en -> id -> first available. */
export function t(map: LocaleMap | null | undefined, locale: Locale): string {
  if (!map) return '';
  return map[locale] ?? map.en ?? map.id ?? Object.values(map)[0] ?? '';
}

export type NavSection =
  | 'about'
  | 'mobility'
  | 'partnership'
  | 'life'
  | 'news'
  | 'none';

export type PageStatus = 'draft' | 'published' | 'archived';
export type ProgramKind = 'inbound' | 'outbound';
export type PartnerKind = 'international' | 'domestic';
export type NewsTag = 'inbound' | 'outbound' | 'partnership';
export type InquiryKind = 'student' | 'partner' | 'outbound';
export type InquiryStatus = 'new' | 'in_progress' | 'closed';

export type BlockType = (typeof BLOCK_TYPES)[number];

/** Universal options every block carries in `config`. */
export type BlockBackground = 'navy' | 'paper' | 'accent-tint';
export type BlockSpacing = 'compact' | 'normal' | 'spacious';

export interface BlockBaseConfig {
  background?: BlockBackground;
  spacing?: BlockSpacing;
  /** Which accent tints/punctuates this section (one-per-section discipline). */
  accent?: 'magenta' | 'amber' | 'cyan' | 'blue';
  [key: string]: unknown;
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  position: number;
  config: BlockBaseConfig;
  content: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: LocaleMap;
  nav_section: NavSection;
  nav_order: number;
  parent_id: string | null;
  status: PageStatus;
  owner_staff_id: string | null;
  seo: {
    title?: LocaleMap;
    description?: LocaleMap;
    og_image_url?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}
