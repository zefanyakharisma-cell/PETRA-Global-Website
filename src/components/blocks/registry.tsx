import type { BlockComponentProps, BlockDefinition, BlockMeta } from './registry.types';
import type { ComponentType } from 'react';
import { BLOCK_META } from './registry.meta';

import { HeroBlock } from './HeroBlock';
import { SectionHeaderBlock } from './SectionHeaderBlock';
import { AudienceDoorsBlock } from './AudienceDoorsBlock';
import { RichTextBlock } from './RichTextBlock';
import { ImageTextSplitBlock } from './ImageTextSplitBlock';
import { StatStripBlock } from './StatStripBlock';
import { CardGridBlock } from './CardGridBlock';
import { AccordionBlock } from './AccordionBlock';
import { StepsBlock } from './StepsBlock';
import { GalleryBlock } from './GalleryBlock';
import { PullQuoteBlock } from './PullQuoteBlock';
import { LogoWallBlock } from './LogoWallBlock';
import { EmbedBlock } from './EmbedBlock';
import { PartnerMapBlock } from './PartnerMapBlock';
import { TestimonialsBlock } from './TestimonialsBlock';
import { NewsFeedBlock } from './NewsFeedBlock';
import { StaffBlock } from './StaffBlock';
import { FacultiesBlock } from './FacultiesBlock';
import { InquiryFormBlock } from './InquiryFormBlock';

/**
 * type → component map. Kept separate from BLOCK_META (the component-free
 * metadata) so client/editor/action code can import metadata without pulling
 * server components across the layer boundary. This module is server-only
 * (imported by <BlockRenderer>).
 */
const COMPONENTS: Record<BlockMeta['type'], ComponentType<BlockComponentProps>> = {
  hero: HeroBlock,
  section_header: SectionHeaderBlock,
  audience_doors: AudienceDoorsBlock,
  rich_text: RichTextBlock,
  image_text_split: ImageTextSplitBlock,
  stat_strip: StatStripBlock,
  card_grid: CardGridBlock,
  accordion: AccordionBlock,
  steps: StepsBlock,
  gallery: GalleryBlock,
  pull_quote: PullQuoteBlock,
  logo_wall: LogoWallBlock,
  embed: EmbedBlock,
  partner_map: PartnerMapBlock,
  testimonials: TestimonialsBlock,
  news_feed: NewsFeedBlock,
  staff: StaffBlock,
  faculties: FacultiesBlock,
  inquiry_form: InquiryFormBlock,
};

export const BLOCK_REGISTRY = Object.fromEntries(
  Object.entries(BLOCK_META).map(([type, meta]) => [
    type,
    { ...meta, Component: COMPONENTS[type as BlockMeta['type']] },
  ]),
) as Record<BlockMeta['type'], BlockDefinition>;
