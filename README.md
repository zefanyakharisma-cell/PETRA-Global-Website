# Petra Christian University — International Office Website

Public website **and** a custom, block-based CMS for the **International Office (IO)**
of **Petra Christian University (PETRA)**, Surabaya.

Visitors browse a fully bilingual (English / Indonesian, Chinese-ready) marketing
site whose every page is composed from a library of reusable content blocks.
Editors sign in to `/admin` to manage those pages with a live, drag-and-drop
visual editor plus schema-driven CRUD for staff, programs, partners, news,
faculties and more.

> **Nothing is seeded by default.** Every list/entity block ships with an on-brand
> empty state. Opt-in seed scripts (`npm run db:seed*`) exist to populate real,
> structured pages (partnership, ICOP, Spectrum, accreditation, pre-departure, …)
> and a clearly-labelled `[Placeholder]` entity seed — none run automatically.

---

## Tech stack

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------ |
| Framework          | **Next.js 14** (App Router, RSC, Server Actions), TypeScript |
| Styling            | **Tailwind CSS** + design tokens in `tailwind.config.ts`     |
| i18n               | **next-intl** — `en`, `id` (append `zh` with no data change) |
| Database / auth    | **Supabase** (Postgres + Row-Level Security + Auth + Storage)|
| Rich text          | **TipTap**                                                   |
| Drag & drop        | **dnd-kit**                                                  |
| Maps               | **react-simple-maps** (partner map) / **maplibre-gl** (location & directions blocks) |
| Charts             | **recharts** (chart block)                                   |
| Animation          | **framer-motion**                                            |
| Transactional mail | **Resend** (inquiry notifications)                           |
| Validation         | **zod**                                                      |

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
npm run dev                        # http://localhost:3000  (redirects to /en)
```

- **Public site:** `/en`, `/id`
- **Admin:** `/admin` (Supabase Auth — create a user in the Supabase dashboard)

You must complete the [Supabase setup](#supabase-setup) before the app can read
or write data.

### Environment (`.env.local`)

See [`.env.local.example`](.env.local.example) for the authoritative list. In short:

| Variable                           | Scope        | Purpose                                                    |
| ---------------------------------- | ------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`         | public       | Supabase project URL                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | public       | Anon key — RLS-scoped reads/writes from the browser/server |
| `SUPABASE_SERVICE_ROLE_KEY`        | **server**   | Bypasses RLS — seed script + inquiry routing only          |
| `RESEND_API_KEY`                   | server       | Sends inquiry notification emails                          |
| `RESEND_FROM_EMAIL`                | server       | Verified Resend "from" address                             |
| `NEXT_PUBLIC_SITE_URL`             | public       | Absolute base URL (sitemap, OG tags, hreflang)             |
| `NEXT_PUBLIC_ADMISSIONS_URL`       | public       | Where the student inquiry preset links out to              |

> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It is used only in
> trusted server code (`createAdminClient()`), never imported into a client
> component.

---

## Supabase setup

The Supabase project is **shared** with another brand, so **every PETRA table
lives in a dedicated `petra_io` Postgres schema — never `public`.** The clients
are pinned to it via `db: { schema: 'petra_io' }`.

1. **Run the migrations** in [`supabase/migrations/`](supabase/migrations) in
   order (`0001` → `0018`), via the Supabase SQL editor or `supabase db push`.
   `0001_petra_io_schema.sql` creates the schema, enums, tables, indexes,
   `updated_at` triggers, RLS policies, and the public `petra-io-media` storage
   bucket. Later migrations add features (domestic partners, faculties, more
   block types, events/downloads, program areas, block presets, map/chart/
   directions blocks, program-area accreditation & study-abroad data, etc.).
2. **Expose the schema to the API:** Dashboard → *Project Settings → API →
   Exposed schemas* → add `petra_io`.
3. **Create an admin user:** *Authentication → Users → Add user*. Any
   authenticated user has full CRUD via RLS.

### Row-Level Security model

| Role                | Can do                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `anon` (public)     | Read **published** pages + their blocks; read active entities; **insert** into `inquiries` (no read) |
| `authenticated`     | Full CRUD on every table                                               |
| `service_role`      | Full access, bypasses RLS (server-only; seed + inquiry routing)        |

Media: the `petra-io-media` bucket is public-read; only authenticated admins can
write. Policies are scoped to that bucket so the shared project's storage is
untouched.

---

## How it fits together

### Request routing (`src/middleware.ts`)

- `/admin/*` and `/editor-preview/*` → gated by Supabase Auth (session refresh
  via `src/lib/supabase/middleware.ts`), **outside** the locale tree.
- Everything else → `next-intl` locale middleware (`/` → `/en`).

### Pages & navigation

- Public pages render at `/[locale]/[...slug]` (a catch-all, so slugs are full
  nested paths like `mobility/inbound/semester-exchange`); news at
  `/[locale]/news/[slug]`; programs at `/[locale]/programs/[slug]`.
- **Navigation auto-builds** from *published* pages grouped by `nav_section`
  (`about`, `mobility`, `partnership`, `life`, `news`), ordered by `nav_order`
  (`src/lib/queries.ts`). Within a section, pages **nest into a layered tree via
  `parent_id`** (section → subsection → item), rendered as dropdown → flyout
  menus. A section with a single root page treats it as the landing page (the
  top-level link) and shows its children beneath. Publish a page into a section,
  set its parent, and it appears in the nav. Use the full path as the slug so the
  URL mirrors the hierarchy.
- The **home page** falls back to a built-in default composition
  (`src/lib/defaultHome.ts`) until a page with slug `home` is published.
- Public pages use **ISR** (`export const revalidate = 60`).

### The block system (the heart of the CMS)

A page is an ordered list of **blocks**. Each block row has a `type`, a
`position`, a `config` (layout options: background, spacing, accent, bento
`size`), and `content` (the translatable copy/data). The registry is split so
that client code and `'use server'` actions can reference block metadata without
importing server components:

| File                                          | Role                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| `src/components/blocks/registry.types.ts`     | Canonical `BLOCK_TYPES` list + editor-field/schema types    |
| `src/components/blocks/registry.meta.ts`      | Component-free metadata: labels, categories, editor schemas, defaults |
| `src/components/blocks/registry.tsx`          | Maps `type` → React component                               |
| `src/components/blocks/BlockRenderer.tsx`     | Renders the same components for **public** and **preview**  |

**Block catalogue** (`~30` types) grouped by category:

- **Layout & hero** — `hero`, `section_header`, `audience_doors`, `divider`
- **Content** — `rich_text`, `image_text_split`, `stat_strip`, `card_grid`,
  `feature_list`, `accordion`, `tabs`, `steps`, `timeline`, `gallery`,
  `pull_quote`, `logo_wall`, `embed`, `map`, `directions`, `chart`,
  `downloads`, `events`
- **Entity-bound** — `partner_map`, `partner_marquee`, `testimonials`,
  `news_feed`, `staff`, `faculties`
- **Conversion** — `cta_banner`, `inquiry_form`

> `map`/`directions` render a MapLibre location map (markers, auto-fit,
> light/dark styles); `chart` renders a recharts graph from manual data or a
> saved database query.

> The **signature feature** is the interactive `partner_map`
> (react-simple-maps), code-split out of the public critical path via
> `PartnerWorldMapLoader`.

### Admin (`/admin`)

- **Auth** (`/admin/login`) and session handling via server actions
  (`src/app/admin/actions/auth.ts`).
- **Entity CRUD** — a single generic, schema-driven screen
  (`_entities/EntityManager.tsx`) renders list + create/edit forms for staff,
  programs, partners, domestic partners, news, testimonials, faculties, study
  programs and courses. The field schema lives in
  `src/app/admin/_entities/config.ts` (`ENTITY_CONFIG`).
- **Page management** (`/admin/pages`) and the **inquiry inbox**
  (`/admin/inquiries`).

### Live editor (`/admin/edit/[slug]`)

- Block picker, **dnd-kit** reordering, duplicate/delete.
- Side-panel forms generated from each block's `EditorSchema`, with **EN/ID
  tabs** for localized fields and conditional field visibility per layout.
- **Live preview** is an iframe to `/editor-preview/[slug]` that renders the real
  *draft* components (auth-gated, outside the locale tree).
- Persisted through server actions in `src/app/admin/actions/cms.ts`.

### Inquiries

The `inquiry_form` block posts to the `submitInquiry` server action
(`src/app/actions/inquiry.ts`):

1. Validates with zod (includes a honeypot field).
2. Inserts a row into `inquiries` (via the service-role client).
3. Resolves the recipient (explicit staff → program owner → fallback) and sends
   a **Resend** notification — best-effort, so a failed email never fails the
   submission.

The student preset instead links out to `NEXT_PUBLIC_ADMISSIONS_URL`.

### Internationalisation

- Locales + routing: `src/i18n/routing.ts`; UI strings: `messages/en.json`,
  `messages/id.json`.
- **All translatable content is stored as JSONB locale maps** `{ en, id }`.
- To add Chinese later: append `'zh'` to `locales`, add `messages/zh.json`, and
  provide `zh` content — **no data-model change**. hreflang alternates are
  already emitted per page.

### Media, SEO & accessibility

- Uploads go to the Supabase `petra-io-media` bucket; served via
  `next/image` (the bucket host is allow-listed in `next.config.mjs`).
- **SEO**: per-page metadata from `pages.seo`, Open Graph / Twitter tags, JSON-LD
  `EducationalOrganization`, generated `sitemap.xml` (`src/app/sitemap.ts`) and
  `robots.txt` (`src/app/robots.ts`), hreflang for en/id.
- **Accessibility** (WCAG 2.1 AA target): semantic landmarks, skip link, visible
  focus, alt text, `prefers-reduced-motion`. Amber/cyan accents always use dark text.

---

## Project structure

```
src/
  app/
    [locale]/          Public site (pages, news, programs, thank-you, 404)
    admin/             CMS: auth, entity CRUD, page mgmt, live editor, inquiries
    editor-preview/    Auth-gated draft preview rendered inside the editor iframe
    api/               media proxy + lightweight site search
    actions/           Public server actions (inquiry submit)
    sitemap.ts / robots.ts
  components/
    blocks/            Block library + registry + renderer
    admin/             Editor UI, TipTap rich-text, image crop/upload fields
    layout/            Navbar, Footer, MobileNav, Search, LanguageSwitcher
    ui/                Shared primitives (Section, Cta, Reveal, world map…)
  lib/
    supabase/          server/client/middleware clients + generated types
    queries.ts         Public data access (pages, nav, news)
    defaultHome.ts     Built-in home fallback composition
    seo.ts, media.ts, types.ts, programAreas.ts, partnerLogos*.ts
  i18n/                next-intl routing + request config
  middleware.ts        Auth gate + locale routing
messages/              UI string catalogues (en, id)
supabase/
  migrations/          0001–0018 schema evolution
  seed*.ts / *.sql     Optional placeholder, page, partner & accreditation seeds
scripts/               build-partner-logos, patch-readlink (Node 24 shim)
assets/                Source partner logos + CSV data (not served directly)
public/fonts/          Self-hosted fonts (see public/fonts/README.md)
```

---

## Scripts

| Command             | What it does                                                     |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Start the dev server (with the Node 24 readlink shim preloaded)  |
| `npm run build`     | Production build (shim preloaded)                                |
| `npm run start`     | Serve the production build                                       |
| `npm run lint`      | `next lint`                                                      |
| `npm run typecheck` | `tsc --noEmit`                                                   |
| `npm run db:seed`   | **Optional** — insert clearly-labelled `[Placeholder]` rows      |
| `npm run db:seed:*` | **Optional** — seed real, structured pages & reference data      |

### Optional seeds (NOT run by default)

```bash
npm run db:seed                    # "[Placeholder]" entity rows; delete later in /admin
npm run db:seed:pages              # core page compositions
npm run db:seed:icop               # ICOP program page
npm run db:seed:spectrum           # Spectrum page
npm run db:seed:accreditation      # accreditation page
npm run db:seed:accreditation-data # accreditation reference data
npm run db:seed:predeparture       # pre-departure page
npm run db:seed:domestic-logos     # domestic partner logos
```

> Seed scripts need server env vars (`SUPABASE_SERVICE_ROLE_KEY`) — they do **not**
> auto-load `.env.local`; export the vars in your shell or prefix the command.

---

## Fonts

Fonts are self-hosted via `@font-face` (see `public/fonts/README.md`). Drop the
**provided licensed** files (Bebas Neue, DIN Condensed, Inter, Baskerville) into
`public/fonts/`. Until then the site falls back to system fonts.

---

## Build & deploy

```bash
npm run build && npm run start
```

Deploy to **Vercel**; set the same environment variables there. ISR is enabled on
public pages, so published content propagates without a redeploy.

### Note on Node 24

Node 24's `fs.readlink` returns `EISDIR` (instead of `EINVAL`) for regular files,
which crashes Next 14's bundled webpack during `next build`. The `dev`/`build`
scripts preload [`scripts/patch-readlink.cjs`](scripts/patch-readlink.cjs) (via
`NODE_OPTIONS`) to normalise the error code, and `next.config.mjs` disables
webpack symlink resolution. On Node 18/20 the shim is a harmless no-op —
**prefer Node 20 LTS in CI** if you can.

---

## Data model (at a glance)

All tables live in the `petra_io` schema. Localized columns are JSONB
(`{ "en": …, "id": … }`).

- **`pages`** → `blocks` (1-to-many, `on delete cascade`, ordered by `position`)
- **`news`** → `blocks` (a block belongs to exactly one page **or** one news article)
- **Entities:** `staff`, `programs`, `partners`, `domestic_partners`,
  `testimonials`, `faculties`, `study_programs`, `courses`
- **`inquiries`** (public insert-only; admin read/manage)
- Relations: programs/pages carry an `owner_staff_id`; testimonials → program;
  study_programs → faculty; courses → study_program.

See `supabase/migrations/*` for the authoritative DDL and RLS policies, and
`src/lib/types.ts` / `src/lib/supabase/types.ts` for the TypeScript mirror.
