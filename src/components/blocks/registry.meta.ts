import type { BlockMeta, EditorField } from './registry.types';


// Bento sizes: width (columns 1–4) × height (units 1–4). See blockSize.ts.
const SIZE_OPTIONS = ([1, 2, 3, 4] as const).flatMap((w) =>
  ([1, 2, 3, 4] as const).map((h) => ({ value: `${w}x${h}`, label: `${w}×${h}` })),
);

// Universal options every block carries (background + spacing + accent + size).
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
    { value: 'magenta', label: 'Magenta (Study / FHIK)' },
    { value: 'blue', label: 'Blue (Partner)' },
    { value: 'amber', label: 'Amber (Go Abroad)' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'red', label: 'Red (Sipil & Ars)' },
    { value: 'orange', label: 'Orange (FTI)' },
    { value: 'green', label: 'Green (SBM)' },
    { value: 'yellow', label: 'Yellow (PGSD)' },
  ] },
  { key: 'size', label: 'Block size (W×H)', type: 'select', default: '4x1',
    help: 'Width in columns (of 4) × height units. 4×1 = full width. Narrower blocks tile side-by-side.',
    options: SIZE_OPTIONS },
];

// Reusable button definition — label + smart link + style + new-tab toggle.
const BUTTON_FIELDS: EditorField[] = [
  { key: 'label', label: 'Label', type: 'text', localized: true },
  { key: 'href', label: 'Link', type: 'link' },
  { key: 'variant', label: 'Style', type: 'select', options: [
    { value: '', label: 'Default (auto)' },
    { value: 'magenta', label: 'Magenta (solid)' },
    { value: 'blue', label: 'Blue (solid)' },
    { value: 'amber', label: 'Amber (solid)' },
    { value: 'navy', label: 'Navy (solid)' },
    { value: 'outline', label: 'Outline' },
  ] },
  { key: 'newTab', label: 'Open in new tab', type: 'boolean' },
];

/**
 * Block registry — the single source of truth mapping each block `type` to its
 * Component, EditorSchema, and defaults. The same registry drives the public
 * <BlockRenderer> and the live editor's block picker + side-panel forms.
 */
export const BLOCK_META: Record<BlockMeta['type'], BlockMeta> = {
  hero: {
    type: 'hero', label: 'Hero', category: 'Layout & hero', defaultConfig: { background: 'navy', spacing: 'spacious', layout: 'centered', bgType: 'image', bgSource: 'programs' },
    defaultContent: { eyebrow: {}, heading: {}, subcopy: {}, ctas: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'select', options: [
          { value: 'centered', label: 'Centered' },
          { value: 'left', label: 'Left' },
          { value: 'split-with-image', label: 'Split with image' },
          { value: 'scroll-expand', label: 'Scroll-to-expand media (immersive)' },
        ] },
        // Standard-hero background options — hidden for the scroll-expand layout,
        // which brings its own media + backdrop fields below.
        { key: 'bgType', label: 'Background (centered/left)', type: 'select',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] }, options: [
          { value: 'none', label: 'Solid colour' },
          { value: 'image', label: 'Uploaded image' },
          { value: 'carousel', label: 'Carousel (auto-rotating)' },
        ] },
        { key: 'bgSource', label: 'Carousel source', type: 'select',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] }, options: [
          { value: 'programs', label: 'Programs (featured first)' },
          { value: 'news', label: 'News & announcements' },
        ] },
        // Scroll-to-expand layout options (shown only for that layout).
        { key: 'scrollMediaType', label: 'Media type', type: 'select', default: 'video',
          showFor: { field: 'layout', equals: ['scroll-expand'] },
          options: [
            { value: 'video', label: 'Video (YouTube / Google Drive / .mp4)' },
            { value: 'image', label: 'Image' },
          ] },
        { key: 'scrollTextBlend', label: 'Blend title with background', type: 'boolean',
          showFor: { field: 'layout', equals: ['scroll-expand'] } },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text', localized: true },
        { key: 'heading', label: 'Headline', type: 'text', localized: true },
        { key: 'subcopy', label: 'Subcopy', type: 'textarea', localized: true },
        // Standard-hero content (hidden for scroll-expand).
        { key: 'image_url', label: 'Background / split image', type: 'image',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] } },
        { key: 'ctas', label: 'Buttons (max 2)', type: 'list', itemFields: BUTTON_FIELDS,
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] } },
        // Scroll-to-expand content (shown only for that layout).
        { key: 'scrollVideoUrl', label: 'YouTube video URL', type: 'url',
          showFor: { field: 'layout', equals: ['scroll-expand'] },
          help: 'Paste a YouTube link (autoplays, muted & looped). A Google Drive video link or a direct .mp4 URL also works. Used when media type is “Video”.' },
        { key: 'scrollBgImage', label: 'Background picture (behind the video)', type: 'image',
          showFor: { field: 'layout', equals: ['scroll-expand'] } },
        { key: 'scrollMediaImage', label: 'Video poster / image (media-type “Image”)', type: 'image',
          showFor: { field: 'layout', equals: ['scroll-expand'] } },
        { key: 'scrollCaption', label: 'Scroll hint caption (e.g. “Scroll to explore”)', type: 'text', localized: true,
          showFor: { field: 'layout', equals: ['scroll-expand'] } },
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
            { value: 'cyan', label: 'Cyan' },
            { value: 'red', label: 'Red (Sipil & Ars)' },
            { value: 'orange', label: 'Orange (FTI)' },
            { value: 'green', label: 'Green (SBM)' },
            { value: 'yellow', label: 'Yellow (PGSD)' },
          ] },
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'blurb', label: 'Blurb', type: 'text', localized: true },
          { key: 'href', label: 'Destination', type: 'url' },
        ] },
      ],
    },
  },
  divider: {
    type: 'divider', label: 'Divider / spacer', category: 'Layout & hero', defaultConfig: { background: 'paper', spacing: 'normal', style: 'line', accent: 'magenta' },
    defaultContent: {},
    editor: {
      config: [
        { key: 'style', label: 'Style', type: 'select', options: [
          { value: 'line', label: 'Hairline' },
          { value: 'dots', label: 'Dots' },
          { value: 'space', label: 'Empty space' },
        ] },
        ...UNIVERSAL,
      ],
      content: [],
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
        { key: 'cta', label: 'CTA', type: 'list', itemFields: BUTTON_FIELDS },
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
    type: 'card_grid', label: 'Card grid', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', source: 'manual', columns: 3, linkToPage: true },
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
        // Card behaviour — any combination may be enabled.
        { key: 'linkToPage', label: 'Card links to its page', type: 'boolean' },
        { key: 'enablePopup', label: 'Card opens a popup (compact details)', type: 'boolean' },
        { key: 'showButton', label: 'Show a clickable button on the card', type: 'boolean' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'buttonLabel', label: 'Button label', type: 'text', localized: true, help: 'Shown when “Show a clickable button” is on. Defaults to “Learn more”.' },
        { key: 'cards', label: 'Manual cards', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'body', label: 'Body', type: 'textarea', localized: true },
          { key: 'image_url', label: 'Image', type: 'image' },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  feature_list: {
    type: 'feature_list', label: 'Feature list', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', columns: 3, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [{ key: 'columns', label: 'Columns', type: 'number' }, ...UNIVERSAL],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
        { key: 'items', label: 'Features', type: 'list', itemFields: [
          { key: 'icon', label: 'Icon', type: 'select', options: [
            { value: 'globe', label: 'Globe' },
            { value: 'graduation', label: 'Graduation cap' },
            { value: 'users', label: 'People' },
            { value: 'handshake', label: 'Handshake' },
            { value: 'book', label: 'Book' },
            { value: 'award', label: 'Award' },
            { value: 'pin', label: 'Map pin' },
            { value: 'plane', label: 'Plane' },
            { value: 'building', label: 'Building' },
            { value: 'heart', label: 'Heart' },
            { value: 'idea', label: 'Lightbulb' },
            { value: 'sparkles', label: 'Sparkles' },
            { value: 'calendar', label: 'Calendar' },
            { value: 'mail', label: 'Mail' },
            { value: 'compass', label: 'Compass' },
            { value: 'star', label: 'Star' },
          ] },
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'body', label: 'Body', type: 'textarea', localized: true },
          { key: 'href', label: 'Link (optional)', type: 'url' },
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
  tabs: {
    type: 'tabs', label: 'Tabs', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', accent: 'magenta' },
    defaultContent: { heading: {}, tabs: [] },
    editor: {
      config: UNIVERSAL,
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'tabs', label: 'Tabs', type: 'list', itemFields: [
          { key: 'label', label: 'Tab label', type: 'text', localized: true },
          { key: 'body', label: 'Panel content', type: 'richtext', localized: true },
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
  timeline: {
    type: 'timeline', label: 'Timeline', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: UNIVERSAL,
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
        { key: 'items', label: 'Milestones', type: 'list', itemFields: [
          { key: 'date', label: 'Date / year', type: 'text' },
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
        { key: 'url', label: 'Embed URL', type: 'url',
          help: 'Paste a YouTube link (watch, youtu.be, or shorts), a Google Drive video share link, or any embeddable URL (Google Maps, Spotify…). Ordinary share links are converted automatically.' },
        { key: 'caption', label: 'Caption', type: 'text', localized: true },
      ],
    },
  },
  downloads: {
    type: 'downloads', label: 'Downloads', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', columns: 1, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [{ key: 'columns', label: 'Columns', type: 'number' }, ...UNIVERSAL],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
        { key: 'items', label: 'Files', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'description', label: 'Description', type: 'text', localized: true },
          { key: 'file', label: 'File', type: 'file' },
        ] },
      ],
    },
  },
  events: {
    type: 'events', label: 'Events / key dates', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', hidePast: false, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [
        { key: 'hidePast', label: 'Hide past events', type: 'boolean' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
        { key: 'items', label: 'Events', type: 'list', itemFields: [
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'endDate', label: 'End date (optional)', type: 'date' },
          { key: 'title', label: 'Title', type: 'text', localized: true },
          { key: 'location', label: 'Location', type: 'text', localized: true },
          { key: 'description', label: 'Description', type: 'textarea', localized: true },
          { key: 'href', label: 'Details / register link', type: 'link' },
        ] },
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
  partner_marquee: {
    type: 'partner_marquee', label: 'Partner logo marquee', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', filterKind: 'all' },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'filterKind', label: 'Logos to show', type: 'select', options: [
          { value: 'all', label: 'All partners' },
          { value: 'international', label: 'International' },
          { value: 'domestic', label: 'Domestic' },
        ] },
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
        { key: 'programId', label: 'Filter by program', type: 'entity', entity: 'programs', help: 'Leave blank to show all testimonials.' },
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
        { key: 'staffId', label: 'Staff member (single)', type: 'entity', entity: 'staff', help: 'Leave blank to use the page owner.' },
        ...UNIVERSAL,
      ],
      content: [],
    },
  },
  faculties: {
    type: 'faculties', label: 'Faculties & programs', category: 'Entity-bound',
    defaultConfig: { background: 'paper', spacing: 'normal', display: 'explorer', showCourses: true, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'display', label: 'Display', type: 'select', options: [
          { value: 'explorer', label: 'Explorer (expandable list)' },
          { value: 'grid', label: 'Grid of faculty cards' },
        ] },
        { key: 'showCourses', label: 'Show courses (explorer)', type: 'boolean' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'intro', label: 'Intro', type: 'textarea', localized: true },
      ],
    },
  },
  cta_banner: {
    type: 'cta_banner', label: 'CTA banner', category: 'Conversion', defaultConfig: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'cyan' },
    defaultContent: { eyebrow: {}, heading: {}, subcopy: {}, ctas: [] },
    editor: {
      config: [
        { key: 'alignment', label: 'Alignment', type: 'select', options: [
          { value: 'center', label: 'Center' },
          { value: 'split', label: 'Split (text left, buttons right)' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text', localized: true },
        { key: 'heading', label: 'Heading', type: 'text', localized: true },
        { key: 'subcopy', label: 'Subcopy', type: 'textarea', localized: true },
        { key: 'ctas', label: 'Buttons (max 2)', type: 'list', itemFields: BUTTON_FIELDS },
      ],
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
        { key: 'programId', label: 'Program (routes to its owner)', type: 'entity', entity: 'programs', help: 'Optional. Inquiries route to this program’s owner.' },
        { key: 'recipientStaffId', label: 'Recipient staff member', type: 'entity', entity: 'staff', help: 'Optional. Overrides who receives the inquiry.' },
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
