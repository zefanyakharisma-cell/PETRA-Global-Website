import type { BlockMeta, EditorField } from './registry.types';
import { PROGRAM_AREAS } from '@/lib/programAreas';


// Bento sizes (width 1–4 × height 1–4) are edited visually — dragged on the tile
// in the live preview or stepped in the panel header — not via a form field.
// See blockSize.ts and the SizeStepper in Editor.tsx.

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
    { value: 'magenta', label: 'Magenta (Study / FHIK)' },
    { value: 'blue', label: 'Blue (Partner)' },
    { value: 'amber', label: 'Amber (Go Abroad)' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'red', label: 'Red (Sipil & Ars)' },
    { value: 'orange', label: 'Orange (FTI)' },
    { value: 'green', label: 'Green (SBM)' },
    { value: 'yellow', label: 'Yellow (PGSD)' },
  ] },
];

// Reusable button definition — label + smart link + style + new-tab toggle.
const BUTTON_FIELDS: EditorField[] = [
  { key: 'label', label: 'Label', type: 'richtext-inline', localized: true },
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
        { key: 'layout', label: 'Layout', type: 'layout', default: 'centered', options: [
          { value: 'centered', label: 'Centered', shape: 'hero-center' },
          { value: 'left', label: 'Left', shape: 'hero-left' },
          { value: 'split-with-image', label: 'Split w/ image', shape: 'hero-split' },
          { value: 'scroll-expand', label: 'Immersive', shape: 'hero-immersive' },
        ] },
        // Standard-hero background options — hidden for the scroll-expand layout,
        // which brings its own media + backdrop fields below.
        { key: 'bgType', label: 'Background (centered/left)', type: 'select',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] }, options: [
          { value: 'none', label: 'Solid colour' },
          { value: 'aurora', label: 'Aurora (animated glow)' },
          { value: 'image', label: 'Uploaded image' },
          { value: 'carousel', label: 'Carousel (auto-rotating)' },
        ] },
        { key: 'bgSource', label: 'Carousel source', type: 'select',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] }, options: [
          { value: 'programs', label: 'Programs (featured first)' },
          { value: 'news', label: 'News & announcements' },
          { value: 'custom', label: 'Uploaded pictures (hand-picked)' },
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
        { key: 'eyebrow', label: 'Eyebrow', type: 'richtext-inline', localized: true },
        { key: 'heading', label: 'Headline', type: 'richtext-inline', localized: true },
        { key: 'subcopy', label: 'Subcopy', type: 'richtext', localized: true },
        // Standard-hero content (hidden for scroll-expand).
        { key: 'image_url', label: 'Background / split image', type: 'image',
          showFor: { field: 'layout', equals: ['centered', 'left', 'split-with-image'] } },
        // Hand-picked carousel pictures — shown only when the carousel source is
        // "Uploaded pictures". Each image uploads to storage or is chosen from the
        // media library (of everything already uploaded to Supabase).
        { key: 'carouselImages', label: 'Carousel pictures', type: 'list',
          showFor: { field: 'bgSource', equals: ['custom'] },
          itemFields: [
            { key: 'image', label: 'Picture', type: 'image' },
            { key: 'title', label: 'Caption (optional)', type: 'text', localized: true },
            { key: 'href', label: 'Link (optional)', type: 'link' },
          ] },
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
        { key: 'scrollCaption', label: 'Scroll hint caption (e.g. “Scroll to explore”)', type: 'richtext-inline', localized: true,
          showFor: { field: 'layout', equals: ['scroll-expand'] } },
      ],
    },
  },
  section_header: {
    type: 'section_header', label: 'Section header', category: 'Layout & hero', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'left', alignment: 'left', accent: 'magenta' },
    defaultContent: { eyebrow: {}, heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'left', options: [
          { value: 'left', label: 'Left', shape: 'align-left' },
          { value: 'center', label: 'Centered', shape: 'align-center' },
          { value: 'boxed', label: 'Boxed', shape: 'boxed' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'richtext-inline', localized: true },
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
      ],
    },
  },
  audience_doors: {
    type: 'audience_doors', label: 'Audience doors', category: 'Layout & hero', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'row' },
    defaultContent: { doors: [
      { accent: 'magenta', title: { en: 'Study at Petra' }, href: '/mobility' },
      { accent: 'blue', title: { en: 'Partner with Petra' }, href: '/partnership' },
      { accent: 'amber', title: { en: 'Go abroad' }, href: '/mobility' },
    ] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'row', options: [
          { value: 'row', label: 'Cards row', shape: 'doors-row' },
          { value: 'stack', label: 'Wide stack', shape: 'doors-stack' },
          { value: 'list', label: 'Compact list', shape: 'rows-thumb' },
        ] },
        ...UNIVERSAL,
      ],
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
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'blurb', label: 'Blurb', type: 'richtext-inline', localized: true },
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
        { key: 'style', label: 'Style', type: 'layout', default: 'line', options: [
          { value: 'line', label: 'Hairline', shape: 'divider-line' },
          { value: 'dots', label: 'Dots', shape: 'divider-dots' },
          { value: 'space', label: 'Empty space', shape: 'divider-space' },
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
        { key: 'width', label: 'Layout', type: 'layout', default: 'narrow', options: [
          { value: 'narrow', label: 'Reading column', shape: 'align-left' },
          { value: 'full', label: 'Full width', shape: 'stack' },
          { value: 'two-column', label: 'Two columns', shape: 'two-col' },
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
        { key: 'imageSide', label: 'Layout', type: 'layout', default: 'left', options: [
          { value: 'left', label: 'Image left', shape: 'split-left' },
          { value: 'right', label: 'Image right', shape: 'split-right' },
          { value: 'stacked', label: 'Stacked', shape: 'split-stack' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'body', label: 'Body', type: 'richtext', localized: true },
        { key: 'image_url', label: 'Image', type: 'image' },
        { key: 'cta', label: 'CTA', type: 'list', itemFields: BUTTON_FIELDS },
      ],
    },
  },
  stat_strip: {
    type: 'stat_strip', label: 'Stat strip', category: 'Content', defaultConfig: { background: 'navy', spacing: 'normal', layout: 'row' },
    defaultContent: { stats: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'row', options: [
          { value: 'row', label: 'Inline row', shape: 'stat-row' },
          { value: 'cards', label: 'Cards', shape: 'stat-cards' },
          { value: 'stacked', label: 'Stacked', shape: 'stat-stack' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'stats', label: 'Stats (2–5)', type: 'list', itemFields: [
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'richtext-inline', localized: true },
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
    type: 'card_grid', label: 'Card grid', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'grid', source: 'manual', columns: 3, linkToPage: true },
    defaultContent: { cards: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Grid', shape: 'grid-3' },
          { value: 'list', label: 'List', shape: 'rows-thumb' },
          { value: 'featured', label: 'Featured', shape: 'featured' },
        ] },
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
        { key: 'buttonLabel', label: 'Button label', type: 'richtext-inline', localized: true, help: 'Shown when “Show a clickable button” is on. Defaults to “Learn more”.' },
        { key: 'cards', label: 'Manual cards', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'body', label: 'Body', type: 'richtext', localized: true },
          { key: 'image_url', label: 'Image', type: 'image' },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  feature_list: {
    type: 'feature_list', label: 'Feature list', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'grid', columns: 3, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Icon grid', shape: 'feature-grid' },
          { value: 'cards', label: 'Cards', shape: 'cards' },
          { value: 'inline', label: 'Inline rows', shape: 'rows-thumb' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number', help: 'Used by the grid & cards layouts.' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
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
          { key: 'image_url', label: 'Photo (optional)', type: 'image' },
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'body', label: 'Body', type: 'richtext', localized: true },
          { key: 'href', label: 'Link (optional)', type: 'url' },
        ] },
      ],
    },
  },
  accordion: {
    type: 'accordion', label: 'Accordion / FAQ', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'bordered', openMode: 'multi' },
    defaultContent: { heading: {}, items: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'bordered', options: [
          { value: 'bordered', label: 'Bordered', shape: 'boxed' },
          { value: 'plain', label: 'Plain', shape: 'rows' },
          { value: 'cards', label: 'Separated', shape: 'cards' },
        ] },
        { key: 'openMode', label: 'Open mode', type: 'select', options: [
          { value: 'multi', label: 'Multi-open' }, { value: 'single', label: 'Single-open' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'items', label: 'Q&A', type: 'list', itemFields: [
          { key: 'q', label: 'Question', type: 'richtext-inline', localized: true },
          { key: 'a', label: 'Answer', type: 'richtext', localized: true },
        ] },
      ],
    },
  },
  tabs: {
    type: 'tabs', label: 'Tabs', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'top', accent: 'magenta' },
    defaultContent: { heading: {}, tabs: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'top', options: [
          { value: 'top', label: 'Tabs on top', shape: 'tabs-top' },
          { value: 'side', label: 'Tabs on side', shape: 'tabs-side' },
          { value: 'pills', label: 'Pills', shape: 'pills' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'tabs', label: 'Tabs', type: 'list', itemFields: [
          { key: 'label', label: 'Tab label', type: 'richtext-inline', localized: true },
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
        { key: 'orientation', label: 'Layout', type: 'layout', default: 'vertical', options: [
          { value: 'vertical', label: 'Vertical', shape: 'steps-v' },
          { value: 'horizontal', label: 'Horizontal', shape: 'steps-h' },
          { value: 'cards', label: 'Cards', shape: 'steps-cards' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'steps', label: 'Steps', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'body', label: 'Detail', type: 'richtext', localized: true },
        ] },
      ],
    },
  },
  timeline: {
    type: 'timeline', label: 'Timeline', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'vertical', accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'vertical', options: [
          { value: 'vertical', label: 'Vertical', shape: 'timeline-v' },
          { value: 'alternating', label: 'Alternating', shape: 'timeline-alt' },
          { value: 'horizontal', label: 'Horizontal', shape: 'timeline-h' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
        { key: 'items', label: 'Milestones', type: 'list', itemFields: [
          { key: 'date', label: 'Date / year', type: 'richtext-inline' },
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'body', label: 'Detail', type: 'richtext', localized: true },
        ] },
      ],
    },
  },
  gallery: {
    type: 'gallery', label: 'Gallery', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'grid', columns: 3 },
    defaultContent: { images: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Grid', shape: 'grid-3' },
          { value: 'masonry', label: 'Masonry', shape: 'masonry' },
          { value: 'carousel', label: 'Carousel', shape: 'carousel' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number', help: 'Used by the grid & masonry layouts.' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'images', label: 'Media', type: 'list', itemFields: [
          { key: 'url', label: 'Image / video poster', type: 'image' },
          { key: 'video', label: 'Video (optional)', type: 'video',
            help: 'Add a video to make this tile a video. Upload a file, or paste a YouTube / Google Drive link. The image above is used as the poster (auto-fetched for YouTube if left blank).' },
          { key: 'alt', label: 'Caption / alt text', type: 'text' },
        ] },
      ],
    },
  },
  pull_quote: {
    type: 'pull_quote', label: 'Pull quote', category: 'Content', defaultConfig: { background: 'navy', spacing: 'spacious', layout: 'centered' },
    defaultContent: { quote: {}, attribution: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'centered', options: [
          { value: 'centered', label: 'Centered', shape: 'quote-center' },
          { value: 'side', label: 'Portrait beside', shape: 'quote-side' },
          { value: 'card', label: 'Boxed card', shape: 'quote-card' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'quote', label: 'Quote', type: 'richtext', localized: true },
        { key: 'attribution', label: 'Attribution', type: 'richtext-inline', localized: true },
        { key: 'portrait_url', label: 'Portrait', type: 'image' },
      ],
    },
  },
  logo_wall: {
    type: 'logo_wall', label: 'Logo wall', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'grid', style: 'grayscale', columns: 4 },
    defaultContent: { heading: {}, logos: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Static grid', shape: 'logo-grid' },
          { value: 'marquee', label: 'Scrolling', shape: 'marquee' },
        ] },
        { key: 'style', label: 'Style', type: 'select', options: [
          { value: 'grayscale', label: 'Grayscale' }, { value: 'color', label: 'Color' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number', help: 'Used by the static grid layout.' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'logos', label: 'Logos', type: 'list', itemFields: [
          { key: 'url', label: 'Logo', type: 'image' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'href', label: 'Link', type: 'url' },
        ] },
      ],
    },
  },
  embed: {
    type: 'embed', label: 'Embed', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'contained', aspect: '16/9' },
    defaultContent: { url: '', caption: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'contained', options: [
          { value: 'contained', label: 'Contained', shape: 'contained' },
          { value: 'wide', label: 'Full width', shape: 'wide' },
          { value: 'framed', label: 'Framed', shape: 'framed' },
        ] },
        { key: 'aspect', label: 'Aspect ratio', type: 'select', options: [
          { value: '16/9', label: '16:9' }, { value: '4/3', label: '4:3' }, { value: '1/1', label: '1:1' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'url', label: 'Embed URL', type: 'url',
          help: 'Paste a YouTube link (watch, youtu.be, or shorts), a Google Drive video share link, or any embeddable URL (Google Maps, Spotify…). Ordinary share links are converted automatically.' },
        { key: 'caption', label: 'Caption', type: 'richtext-inline', localized: true },
      ],
    },
  },
  map: {
    type: 'map', label: 'Map', category: 'Content',
    defaultConfig: { background: 'paper', spacing: 'normal', layout: 'center', accent: 'blue', mapStyle: 'light', height: 'md', zoom: 11, showRoute: true, showControls: true },
    defaultContent: {
      heading: {},
      markers: [
        { label: { en: 'Petra Christian University', id: 'Universitas Kristen Petra' }, latitude: -7.2575, longitude: 112.7521 },
      ],
    },
    editor: {
      config: [
        { key: 'layout', label: 'Heading layout', type: 'layout', default: 'center', options: [
          { value: 'center', label: 'Centered', shape: 'map-center' },
          { value: 'left', label: 'Left', shape: 'map-left' },
        ] },
        { key: 'mapStyle', label: 'Map style', type: 'select', default: 'light', options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ] },
        { key: 'height', label: 'Height', type: 'select', default: 'md', options: [
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
        ] },
        { key: 'zoom', label: 'Zoom (1–18)', type: 'number', help: 'Starting zoom. Ignored when 2+ markers are set — the map auto-fits to them.' },
        { key: 'showRoute', label: 'Connect markers with a route line', type: 'boolean' },
        { key: 'showControls', label: 'Show zoom / fullscreen controls', type: 'boolean' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'markers', label: 'Markers', type: 'list', itemFields: [
          { key: 'label', label: 'Label', type: 'text', localized: true, help: 'Shown as a tooltip on hover.' },
          { key: 'latitude', label: 'Latitude', type: 'number', help: 'e.g. -7.2575' },
          { key: 'longitude', label: 'Longitude', type: 'number', help: 'e.g. 112.7521' },
        ] },
      ],
    },
  },
  downloads: {
    type: 'downloads', label: 'Downloads', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'list', columns: 1, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'list', options: [
          { value: 'list', label: 'List', shape: 'rows-thumb' },
          { value: 'cards', label: 'Cards', shape: 'cards' },
          { value: 'compact', label: 'Compact', shape: 'rows' },
        ] },
        { key: 'columns', label: 'Columns', type: 'number', help: 'Used by the list & cards layouts.' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
        { key: 'items', label: 'Files', type: 'list', itemFields: [
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'description', label: 'Description', type: 'richtext-inline', localized: true },
          { key: 'file', label: 'File', type: 'file' },
        ] },
      ],
    },
  },
  events: {
    type: 'events', label: 'Events / key dates', category: 'Content', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'list', hidePast: false, accent: 'magenta' },
    defaultContent: { heading: {}, intro: {}, items: [] },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'list', options: [
          { value: 'list', label: 'List', shape: 'rows' },
          { value: 'cards', label: 'Cards', shape: 'cards' },
          { value: 'compact', label: 'Compact', shape: 'rows-thumb' },
        ] },
        { key: 'hidePast', label: 'Hide past events', type: 'boolean' },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
        { key: 'items', label: 'Events', type: 'list', itemFields: [
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'endDate', label: 'End date (optional)', type: 'date' },
          { key: 'title', label: 'Title', type: 'richtext-inline', localized: true },
          { key: 'location', label: 'Location', type: 'richtext-inline', localized: true },
          { key: 'description', label: 'Description', type: 'richtext', localized: true },
          { key: 'href', label: 'Details / register link', type: 'link' },
        ] },
      ],
    },
  },
  partner_map: {
    type: 'partner_map', label: 'Partner map', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', layout: 'center', filterKind: 'all', defaultZoom: 1 },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Heading layout', type: 'layout', default: 'center', options: [
          { value: 'center', label: 'Centered', shape: 'map-center' },
          { value: 'left', label: 'Left', shape: 'map-left' },
        ] },
        { key: 'filterKind', label: 'Filter', type: 'select', options: [
          { value: 'all', label: 'All partners' },
          { value: 'international', label: 'International' },
          { value: 'domestic', label: 'Domestic' },
        ] },
        { key: 'defaultZoom', label: 'Default zoom', type: 'number' },
        ...UNIVERSAL,
      ],
      content: [{ key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true }],
    },
  },
  partner_marquee: {
    type: 'partner_marquee', label: 'Partner logo marquee', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', layout: 'rows', filterKind: 'all' },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'rows', options: [
          { value: 'rows', label: 'Scrolling rows', shape: 'marquee' },
          { value: 'single', label: 'Single row', shape: 'marquee-1' },
          { value: 'static', label: 'Static grid', shape: 'logo-grid' },
        ] },
        { key: 'filterKind', label: 'Logos to show', type: 'select', options: [
          { value: 'all', label: 'All partners' },
          { value: 'international', label: 'International' },
          { value: 'domestic', label: 'Domestic' },
        ] },
        ...UNIVERSAL,
      ],
      content: [{ key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true }],
    },
  },
  testimonials: {
    type: 'testimonials', label: 'Testimonials', category: 'Entity-bound', defaultConfig: { background: 'navy', spacing: 'normal', layout: 'grid' },
    defaultContent: {},
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Grid', shape: 'grid-3' },
          { value: 'carousel', label: 'Carousel', shape: 'carousel' },
          { value: 'masonry', label: 'Masonry', shape: 'masonry' },
        ] },
        { key: 'programId', label: 'Filter by program', type: 'entity', entity: 'programs', help: 'Leave blank to show all testimonials.' },
        ...UNIVERSAL,
      ],
      content: [],
    },
  },
  news_feed: {
    type: 'news_feed', label: 'News feed', category: 'Entity-bound', defaultConfig: { background: 'paper', spacing: 'normal', layout: 'grid', count: 3 },
    defaultContent: { heading: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'grid', options: [
          { value: 'grid', label: 'Grid', shape: 'grid-3' },
          { value: 'list', label: 'List', shape: 'rows-thumb' },
          { value: 'featured', label: 'Featured', shape: 'featured' },
        ] },
        { key: 'count', label: 'Count', type: 'number' },
        { key: 'tag', label: 'Tag filter (contextual)', type: 'select', options: [
          { value: '', label: 'Latest (no filter)' },
          { value: 'inbound', label: '#inbound' },
          { value: 'outbound', label: '#outbound' },
          { value: 'partnership', label: '#partnership' },
        ] },
        ...UNIVERSAL,
      ],
      content: [{ key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true }],
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
        { key: 'layout', label: 'Directory layout', type: 'layout', default: 'grid',
          showFor: { field: 'mode', equals: ['directory'] }, options: [
          { value: 'grid', label: 'Cards grid', shape: 'directory-grid' },
          { value: 'list', label: 'List', shape: 'directory-list' },
        ] },
        { key: 'staffId', label: 'Staff member (single)', type: 'entity', entity: 'staff', help: 'Leave blank to use the page owner.' },
        ...UNIVERSAL,
      ],
      content: [],
    },
  },
  faculties: {
    type: 'faculties', label: 'Faculties & programs', category: 'Entity-bound',
    defaultConfig: { background: 'paper', spacing: 'normal', display: 'explorer', areas: ['course'], facultyIds: [], programIds: [], accent: 'magenta' },
    defaultContent: { heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'display', label: 'Layout', type: 'layout', default: 'explorer', options: [
          { value: 'explorer', label: 'Explorer', shape: 'explorer' },
          { value: 'grid', label: 'Faculty cards', shape: 'faculty-grid' },
          { value: 'cover', label: 'Cover tiles', shape: 'faculty-cover' },
          { value: 'list', label: 'Directory list', shape: 'faculty-list' },
        ] },
        { key: 'facultyIds', label: 'Faculties to show', type: 'entitymulti', entity: 'faculties',
          help: 'Leave all unchecked to show every faculty.' },
        { key: 'programIds', label: 'Study programs to show', type: 'entitymulti', entity: 'study_programs',
          help: 'Leave all unchecked to show every study program (within the chosen faculties).',
          showFor: { field: 'display', equals: ['explorer'] } },
        { key: 'areas', label: 'Areas to show', type: 'multiselect',
          options: PROGRAM_AREAS.map((a) => ({ value: a.value, label: a.en })),
          help: 'Sections listed under each study program. Pick one or more.',
          showFor: { field: 'display', equals: ['explorer'] } },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
      ],
    },
  },
  cta_banner: {
    type: 'cta_banner', label: 'CTA banner', category: 'Conversion', defaultConfig: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'cyan' },
    defaultContent: { eyebrow: {}, heading: {}, subcopy: {}, ctas: [] },
    editor: {
      config: [
        { key: 'alignment', label: 'Layout', type: 'layout', default: 'center', options: [
          { value: 'center', label: 'Centered', shape: 'align-center' },
          { value: 'split', label: 'Split', shape: 'form-split' },
          { value: 'stacked', label: 'Stacked left', shape: 'stack' },
        ] },
        ...UNIVERSAL,
      ],
      content: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'richtext-inline', localized: true },
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'subcopy', label: 'Subcopy', type: 'richtext', localized: true },
        { key: 'ctas', label: 'Buttons (max 2)', type: 'list', itemFields: BUTTON_FIELDS },
      ],
    },
  },
  inquiry_form: {
    type: 'inquiry_form', label: 'Inquiry form', category: 'Conversion', defaultConfig: { background: 'navy', spacing: 'spacious', layout: 'centered', preset: 'student' },
    defaultContent: { heading: {}, intro: {} },
    editor: {
      config: [
        { key: 'layout', label: 'Layout', type: 'layout', default: 'centered', options: [
          { value: 'centered', label: 'Centered', shape: 'form-center' },
          { value: 'split', label: 'Intro beside', shape: 'form-split' },
          { value: 'card', label: 'Boxed card', shape: 'quote-card' },
        ] },
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
        { key: 'heading', label: 'Heading', type: 'richtext-inline', localized: true },
        { key: 'intro', label: 'Intro', type: 'richtext', localized: true },
      ],
    },
  },
};

export const BLOCK_META_LIST: BlockMeta[] = Object.values(BLOCK_META);
