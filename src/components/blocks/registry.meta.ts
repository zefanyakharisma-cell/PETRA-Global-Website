import type { BlockMeta, EditorField } from './registry.types';


// Universal options every block carries (background + spacing + accent).
const UNIVERSAL: EditorField[] = [
  { key: 'background', label: 'Background', type: 'select', options: [
    { value: 'paper', label: 'Paper (light)' },
    { value: 'navy', label: 'Navy' },
    { value: 'accent-tint', label: 'Accent tint' },
  ] },
  { key: 'spacing', label: 'Spacing', type: 'select', options: [
    { value: 'compact', label: 'Compact' },
    { value: 'normal', label: 'Normal' },
    { value: 'spacious', label: 'Spacious' },
  ] },
  { key: 'accent', label: 'Accent', type: 'select', options: [
    { value: 'magenta', label: 'Magenta (Study)' },
    { value: 'blue', label: 'Blue (Partner)' },
    { value: 'amber', label: 'Amber (Go Abroad)' },
    { value: 'cyan', label: 'Cyan' },
  ] },
];

/**
 * Block registry — the single source of truth mapping each block `type` to its
 * Component, EditorSchema, and defaults. The same registry drives the public
 * <BlockRenderer> and the live editor's block picker + side-panel forms.
 */
export const BLOCK_META: Record<BlockMeta['type'], BlockMeta> = {
  hero: {
    type: 'hero', label: 'Hero', category: 'Layout & hero', defaultConfig: { background: 'navy', spacing: 'spacious', layout: 'centered' },
    defaultContent: { eyebrow: {}, heading: {}, subcopy: {}, ctas: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'select', options: [
          { value: 'centered', label: 'Centered' },
          { value: 'left', label: 'Left' },
          { value: 'split-with-image', label: 'Split with image' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text', localized: true },
        { key: 'heading', label: 'Headline', type: 'text', localized: true },
        { key: 'subcopy', label: 'Subcopy', type: 'textarea', localized: true },
        { key: 'image_url', label: 'Background / split image', type: 'image' },
        { key: 'ctas', label: 'Buttons (max 2)', type: 'list', itemFields: [
          { key: 'label', label: 'Label', type: 'text', localized: true },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  section_header: {
    type: 'section_header', label: 'Section header', category: 'Layout & hero', defaultConfig: { background: 'paper', spacing: 'normal', alignment: 'left', accent: 'magenta' },
    defaultContent: { eyebrow: {}, heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'alignment', label: 'Alignment', type: 'select', options: [
          { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text', localized: true },
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
      ],
    },
  },
  audience_doors: {
    type: 'audience_doors', label: 'Audience doors', category: 'Layout & hero', defaultConfig: { background: 'paper', spacing: 'normal' },
    defaultContent: { doors: [
      { accent: 'magenta', title: { en: 'Study at Petra' }, href: '/mobility' },
      { accent: 'blue', title: { en: 'Partner with Petra' }, href: '/partnership' },
      { accent: 'amber', title: { en: 'Go abroad' }, href: '/mobility' },
    ] },
    editor: {
      config: UNIVERSAL,
      content: [
        { key: 'doors', label: 'Doors', type: 'list', itemFields: [
          { key: 'accent', label: 'Accent', type: 'select', options: [
            { value: 'magenta', label: 'Magenta (Study)' },
            { value: 'blue', label: 'Blue (Partner)' },
            { value: 'amber', label: 'Amber (Go Abroad)' },
          ] },
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'blurb', label: 'Blurb', type: 'text', localized: true },
          { key: 'href', label: 'Destination', type: 'url' },
        ] },
      ],
    },
  },
  rich_text: {
    type: 'rich_text', label: 'Rich text', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', width: 'narrow' },
    defaultContent: { html: {} },
    editor: {
      config: [
        { key: 'width', label: 'Width', type: 'select', options: [
          { value: 'narrow', label: 'Narrow reading column' }, { value: 'full', label: 'Full' },
        ] },
        ...UNIVERSAL,
      ],
      content: [{ key: 'html', label: 'Body', type: 'richtext', localized: true }],
    },
  },
  image_text_split: {
    type: 'image_text_split', label: 'Image + text', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', imageSide: 'left' },
    defaultContent: { heading: {}, body: {} },
    editor: {
      config: [
        { key: 'imageSide', label: 'Image side', type: 'select', options: [
          { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'body', label: 'Body', type: 'textarea', localized: true },
        { key: 'image_url', label: 'Image', type: 'image' },
        { key: 'cta', label: 'CTA', type: 'list', itemFields: [
          { key: 'label', label: 'Label', type: 'text', localized: true },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  stat_strip: {
    type: 'stat_strip', label: 'Stat strip', category: 'Content', defaultConfig: { background: 'navy', spacing: 'normal' },
    defaultContent: { stats: [] },
    editor: {
      config: UNIVERSAL,
      content: [
        { key: 'stats', label: 'Stats (2–5)', type: 'list', itemFields: [
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text', localized: true },
          { key: 'auto', label: 'Auto-count', type: 'select', options: [
            { value: 'none', label: 'Manual value' },
            { value: 'partners', label: 'All partners' },
            { value: 'partners_international', label: 'International partners' },
            { value: 'programs', label: 'Programs' },
          ] },
        ] },
      ],
    },
  },
  card_grid: {
    type: 'card_grid', label: 'Card grid', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', source: 'manual', columns: 3 },
    defaultContent: { cards: [] },
    editor: {
      config: [
        { key: 'source', label: 'Source', type: 'select', options: [
          { value: 'manual', label: 'Manual cards' },
          { value: 'programs', label: 'Programs' },
          { value: 'news', label: 'News' },
          { value: 'partners', label: 'Partners' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'cards', label: 'Manual cards', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'body', label: 'Body', type: 'textarea', localized: true },
          { key: 'image_url', label: 'Image', type: 'image' },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  accordion: {
    type: 'accordion', label: 'Accordion / FAQ', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', openMode: 'multi' },
    defaultContent: { heading: {}, items: [] },
    editor: {
      config: [
        { key: 'openMode', label: 'Open mode', type: 'select', options: [
          { value: 'multi', label: 'Multi-open' }, { value: 'single', label: 'Single-open' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'items', label: 'Q&A', type: 'list', itemFields: [
          { key: 'q', label: 'Question', type: 'text', localized: true },
          { key: 'a', label: 'Answer', type: 'textarea', localized: true },
        ] },
      ],
    },
  },
  steps: {
    type: 'steps', label: 'Steps', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', orientation: 'vertical' },
    defaultContent: { heading: {}, steps: [] },
    editor: {
      config: [
        { key: 'orientation', label: 'Orientation', type: 'select', options: [
          { value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'steps', label: 'Steps', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'body', label: 'Detail', type: 'textarea', localized: true },
        ] },
      ],
    },
  },
  gallery: {
    type: 'gallery', label: 'Gallery', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', columns: 3 },
    defaultContent: { images: [] },
    editor: {
      config: [{ key: 'columns', label: 'Columns', type: 'number' }, ...UNIVERSAL],
      content: [
        { key: 'images', label: 'Images', type: 'list', itemFields: [
          { key: 'url', label: 'Image', type: 'image' },
          { key: 'alt', label: 'Alt text', type: 'text' },
        ] },
      ],
    },
  },
  pull_quote: {
    type: 'pull_quote', label: 'Pull quote', category: 'Content', defaultConfig: { background: 'navy', spacing: 'spacious' },
    defaultContent: { quote: {}, attribution: {} },
    editor: {
      config: UNIVERSAL,
      content: [
        { key: 'quote', label: 'Quote', type: 'textarea', localized: true },
        { key: 'attribution', label: 'Attribution', type: 'text', localized: true },
        { key: 'portrait_url', label: 'Portrait', type: 'image' },
      ],
    },
  },
  logo_wall: {
    type: 'logo_wall', label: 'Logo wall', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', style: 'grayscale', columns: 4 },
    defaultContent: { heading: {}, logos: [] },
    editor: {
      config: [
        { key: 'style', label: 'Style', type: 'select', options: [
          { value: 'grayscale', label: 'Grayscale' }, { value: 'color', label: 'Color' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'logos', label: 'Logos', type: 'list', itemFields: [
          { key: 'url', label: 'Logo', type: 'image' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  embed: {
    type: 'embed', label: 'Embed', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', aspect: '16/9' },
    defaultContent: { url: '', caption: {} },
    editor: {
      config: [
        { key: 'aspect', label: 'Aspect ratio', type: 'select', options: [
          { value: '16/9', label: '16:9' }, { value: '4/3', label: '4:3' }, { value: '1/1', label: '1:1' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'url', label: 'Embed URL', type: 'url' },
        { key: 'caption', label: 'Caption', type: 'text', localized: true },
      ],
    },
  },
  partner_map: {
    type: 'partner_map', label: 'Partner map', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', filterKind: 'all', defaultZoom: 1 },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'filterKind', label: 'Filter', type: 'select', options: [
          { value: 'all', label: 'All partners' },
          { value: 'international', label: 'International' },
          { value: 'domestic', label: 'Domestic' },
        ] },
        { key: 'defaultZoom', label: 'Default zoom', type: 'number' },
        ...UNIVERSAL,
      ],
      content: [{ key: 'heading', label: 'Heading', type: 'text', localized: true }],
    },
  },
  testimonials: {
    type: 'testimonials', label: 'Testimonials', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', layout: 'grid' },
    defaultContent: {},
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'select', options: [
          { value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' },
        ] },
        { key: 'programId', label: 'Filter by program ID', type: 'text' },
        ...UNIVERSAL,
      ],
      content: [],
    },
  },
  news_feed: {
    type: 'news_feed', label: 'News feed', category: 'Entity-bound', defaultConfig: { background: 'paper', spacing: 'normal', count: 3 },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'count', label: 'Count', type: 'number' },
        { key: 'tag', label: 'Tag filter (contextual)', type: 'select', options: [
          { value: '', label: 'Latest (no filter)' },
          { value: 'inbound', label: '#inbound' },
          { value: 'outbound', label: '#outbound' },
          { value: 'partnership', label: '#partnership' },
        ] },
        ...UNIVERSAL,
      ],
      content: [{ key: 'heading', label: 'Heading', type: 'text', localized: true }],
    },
  },
  staff: {
    type: 'staff', label: 'Staff', category: 'Entity-bound', defaultConfig: { background: 'paper', spacing: 'normal', mode: 'single' },
    defaultContent: {},
    editor: {
      config: [
        { key: 'mode', label: 'Mode', type: 'select', options: [
          { value: 'single', label: 'Single ("Talk to…")' },
          { value: 'directory', label: 'Directory' },
        ] },
        { key: 'staffId', label: 'Staff ID (single; blank = page owner)', type: 'text' },
        ...UNIVERSAL,
      ],
      content: [],
    },
  },
  inquiry_form: {
    type: 'inquiry_form', label: 'Inquiry form', category: 'Conversion', defaultConfig: { background: 'navy', spacing: 'spacious', preset: 'student' },
    defaultContent: { heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'preset', label: 'Preset', type: 'select', options: [
          { value: 'student', label: 'Student (Admissions link)' },
          { value: 'partner', label: 'Partner (meeting request)' },
          { value: 'outbound', label: 'Outbound (internal)' },
        ] },
        { key: 'programId', label: 'Program ID (routes to owner)', type: 'text' },
        { key: 'recipientStaffId', label: 'Recipient staff ID', type: 'text' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
      ],
    },
  },
};

export const BLOCK_META_LIST: BlockMeta[] = Object.values(BLOCK_META);
