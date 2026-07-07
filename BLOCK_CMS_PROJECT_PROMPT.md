# Master Prompt — Build a Block-Based Website + CMS

> **What this is.** A comprehensive, reusable prompt for generating a project with the
> **same architecture** as the PETRA International Office site — a public website whose
> every page is composed from a library of reusable **content blocks**, backed by a
> custom **CMS** with a live drag-and-drop editor, generalized so it works for *any*
> site type: portfolio, landing page, agency/marketing site, product site, institutional
> site, event, docs, etc.
>
> **How to use it.** Fill in **Part 1 — Project Brief** (the only part you change per
> project). Leave **Parts 2–9** as-is: they are the fixed architecture that makes the
> output come out like this project (CMS + Block + public page). Paste the whole thing to
> your coding agent.

---

## PART 1 — PROJECT BRIEF (fill this in)

Replace every `«…»`. Delete rows you don't need; add rows you do. Everything else in this
document stays constant.

```
PROJECT NAME:          «e.g. Aurora Studio Portfolio»
SITE TYPE:             «portfolio | landing page | agency | product | institutional | event | docs»
ONE-LINE PURPOSE:      «who it's for and what it must accomplish»
PRIMARY AUDIENCE:      «e.g. prospective clients / recruiters / students / buyers»
BRAND PERSONALITY:     «e.g. minimal & editorial | bold & energetic | corporate & trustworthy»

LANGUAGES:             «default + others, e.g. en (default), id; zh-ready»  ← 1 language is fine; keep the locale-map data model anyway
DOMAIN / SITE URL:     «https://example.com»

TOP-LEVEL NAV SECTIONS: «e.g. Work, About, Services, Journal, Contact»
CORE ENTITIES (structured, reusable records the CMS manages):
   «e.g. projects, clients, services, team, testimonials, posts»
   (For each: a short list of fields. Localized text fields → JSONB locale maps.)

SIGNATURE / HERO FEATURE: «the one memorable, code-split block — e.g. interactive
   world map, 3D showcase, scroll-driven case-study reel, live pricing configurator»

CONVERSION GOAL:       «contact form → email routing | newsletter | book-a-call | buy»
CONTACT/LEAD ROUTING:  «who receives submissions + fallback»

BRAND TOKENS:
   Fonts:              «display + body font families»
   Colors:             «primary, accent(s), paper/background, ink/text»
   Accent semantics:   «optional: map accents to sections/categories»

CONTENT SEEDING:       «real content | clearly-labelled [Placeholder] seed, NOT run by default»
```

---

## PART 2 — NON-NEGOTIABLE ARCHITECTURE (keep verbatim)

Build a **Next.js 14 (App Router)** + **TypeScript** + **Tailwind** application backed by
**Supabase (Postgres + Auth + Storage)**. It has three surfaces:

1. **Public site** — fully static-friendly (ISR), composed entirely from **blocks**.
2. **CMS admin** (`/admin`) — auth-gated: entity CRUD + page management + a **live,
   drag-and-drop block editor** + a lead/inquiry inbox.
3. **Draft preview** (`/editor-preview/[slug]`) — auth-gated route that renders the real
   *draft* blocks inside the editor's iframe.

**The central idea:** a page is an **ordered list of block rows**. Each block row has:
`type`, `position`, `config` (layout options — background, spacing, accent, size), and
`content` (the translatable copy/data). One **block registry** is the single source of
truth; the *same* renderer draws blocks for both the public site and the editor preview,
guaranteeing WYSIWYG.

### Fixed tech choices

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS + design tokens in `tailwind.config.ts` |
| i18n | `next-intl` — locale-prefixed routes (`/` → `/<default>`); Chinese/any lang addable with **no data-model change** |
| DB / Auth / Storage | Supabase (Postgres + Row-Level Security + Auth + public media bucket) |
| Rich text | TipTap (links, highlight, align, color, underline) |
| Drag & drop | dnd-kit (`@dnd-kit/core` + `sortable`) |
| Forms / validation | react-hook-form + zod (client and **server**-side) |
| Animation | framer-motion (respect `prefers-reduced-motion`) |
| Transactional email | Resend (best-effort lead notifications) |
| Media cropping | react-easy-crop → upload to Supabase Storage → served via `next/image` |
| Hosting | Vercel with **ISR** so published content propagates without a redeploy |

> If a listed dependency doesn't apply to the brief (e.g. no map), omit it — but keep the
> **registry / block / renderer / entity-config** patterns intact.

---

## PART 3 — DATA MODEL (Supabase, keep the shape)

All tables live in a **dedicated named Postgres schema** (never `public`) — call it
`«project»_io` or similar — so the project can safely share a Supabase instance. Pin the
clients to it via `db: { schema: '<schema>' }`, and expose the schema in
*Project Settings → API → Exposed schemas*.

**Conventions (apply to every table):**
- `id uuid primary key default gen_random_uuid()`
- `created_at`, `updated_at timestamptz`; a shared `set_updated_at()` trigger.
- **Every translatable text column is `jsonb` holding a locale map** `{ "en": "...", "id": "..." }`.
  Single-language projects still use this shape (just one key) — that's what makes adding a
  language a no-op later.
- Enums for constrained values (status, kinds, sections). Use widen-able `check`
  constraints or enums you can `ALTER` when adding variants.

### Core CMS tables (always present)

```
pages (
  id, slug text unique, title jsonb,
  nav_section enum(<your sections> | 'none'), nav_order int,
  parent_id uuid → pages(id),           -- self-reference builds the nav tree
  status enum('draft','published','archived'),
  owner_id uuid → team(id) null,        -- optional
  seo jsonb,                            -- { title, description, og_image_url } per locale
  created_at, updated_at
)

blocks (
  id, page_id uuid → pages(id) ON DELETE CASCADE,
  type enum(<block types>) OR text,     -- keep in lockstep with the registry
  position int,                        -- ordering within the page
  config jsonb,                        -- background, spacing, accent, size, layout
  content jsonb,                       -- translatable copy/data
  created_at, updated_at
)
-- index blocks(page_id, position); index pages(nav_section, nav_order)
```

Optionally allow a block to belong to a **content record instead of a page** (e.g. a blog
post body built from blocks) via a nullable second FK, with a check that exactly one parent
is set — mirror the PETRA `news`↔`blocks` relation only if the brief needs block-composed
articles.

### Entity tables (derive from the brief's CORE ENTITIES)

Each entity = one table with plain columns + `jsonb` localized columns + relations. Model
them like the PETRA entities (`staff`, `programs`, `partners`, `testimonials`, `faculties`,
`study_programs`, `courses`): parent/child via FKs, an `is_active`/`is_featured` boolean
where useful, a `slug` where the entity has a detail page.

### Leads / inquiries table (if there's a conversion goal)

```
inquiries (
  id, kind enum(<inquiry kinds>), payload jsonb,
  related_id uuid null, recipient_id uuid null,
  status enum('new','in_progress','closed'), created_at
)   -- public INSERT only, no public SELECT
```

### Row-Level Security (mandatory — versioned SQL, re-runnable with drop-if-exists guards)

| Role | Permissions |
|---|---|
| `anon` (public) | SELECT **published** pages + their blocks; SELECT active/published entities; **INSERT** into `inquiries` only (no read) |
| `authenticated` (admin) | Full CRUD on every table |
| `service_role` | Bypasses RLS — **server-only** (seed script + lead routing). Never import its key into a client component. |

Media: one **public-read** Storage bucket; **write only for `authenticated`**, policies
scoped to that bucket. Serve uploads through `next/image` (allow-list the bucket host in
`next.config.mjs`).

Ship the DB as **ordered, versioned migrations** (`0001_schema.sql` creates schema, enums,
tables, indexes, triggers, RLS, storage bucket; later files add features). Keep a
TypeScript mirror of the types in `src/lib/types.ts`.

---

## PART 4 — THE BLOCK SYSTEM (the heart of it — replicate exactly)

Split the registry into **four files** so client code and `'use server'` actions can
reference block metadata **without importing server components** (this is what keeps Next's
action bundling from dragging server components across the boundary):

| File | Role |
|---|---|
| `registry.types.ts` | Canonical `BLOCK_TYPES` tuple (source of truth for the `BlockType` union) + the `EditorField` / `EditorSchema` / `BlockMeta` types |
| `registry.meta.ts` | **Component-free** metadata: `label`, `category`, `editor` schema, `defaultConfig`, `defaultContent` for every block |
| `registry.tsx` | Maps `type` → React component |
| `BlockRenderer.tsx` | Renders the same components for **public** and **preview** (`mode: 'public' \| 'edit'`) |

**Every block declares an `EditorSchema`** — two field lists, `config` (layout/source) and
`content` (copy/data) — that the live editor turns into a side-panel form automatically. The
field types to support (data-only, serialisable — no functions in the schema):

`text`, `textarea`, `richtext`, `richtext-inline`, `image`, `video`, `url`, `link`, `file`,
`date`, `number`, `boolean`, `select`, `layout` (thumbnail picker), `multiselect`,
`entity` / `entitymulti` (pick record(s) of a given table), and `list` (repeating group with
nested `itemFields`).

- Mark localized fields with `localized: true` → the editor shows **per-locale tabs**.
- Support **conditional visibility**: `showFor: { field, equals: [...] }` so one block can
  present different options per layout (e.g. Hero: centered / left / split / immersive).
- **Universal config on every block:** `background`, `spacing`, and an `accent` token.

### Block catalogue (start from this generalized set; rename/trim per brief)

- **Layout & hero:** `hero`, `section_header`, `divider`, `audience_doors` (segmented entry cards)
- **Content:** `rich_text`, `image_text_split`, `stat_strip`, `card_grid`, `feature_list`,
  `accordion`, `tabs`, `steps`, `timeline`, `gallery`, `pull_quote`, `logo_wall`, `embed`,
  `downloads`, `events`, `map`
- **Entity-bound** (render from CMS records, not hand-typed): e.g. `projects_grid`,
  `testimonials`, `news_feed`/`post_feed`, `team`, `logo/partner_marquee`, plus the brief's
  **signature block** (code-split off the critical path via a dynamic loader)
- **Conversion:** `cta_banner`, `inquiry_form`

> Adapt entity-bound block names to the brief's entities, but keep the *mechanism*: an
> entity-bound block stores a query/selection in `config` and renders live records.

**Adding a block is a fixed recipe** (document it in the README): (1) add the type to
`BLOCK_TYPES`; (2) add its `BlockMeta` (label, category, editor schema, defaults) in
`registry.meta.ts`; (3) build the component; (4) register it in `registry.tsx`; (5) widen
the DB block-type enum/constraint in a new migration.

---

## PART 5 — PUBLIC SITE & NAVIGATION

- **Routing** (`src/middleware.ts`): `/admin/*` and `/editor-preview/*` are **auth-gated and
  outside the locale tree**; everything else goes through the `next-intl` locale middleware
  (`/` → `/<default locale>`).
- **Pages** render at `/[locale]/[...slug]` (catch-all, so slugs are full nested paths like
  `work/case-studies/aurora`). Add dedicated detail routes for entities that need them
  (`/[locale]/<entity>/[slug]`).
- **Navigation auto-builds** from *published* pages grouped by `nav_section`, ordered by
  `nav_order`, nested into a tree via `parent_id` → rendered as dropdown → flyout menus.
  Publishing a page into a section with a parent makes it appear in the nav; use the full
  path as the slug so the URL mirrors the hierarchy.
- **Home page** falls back to a built-in default composition (`src/lib/defaultHome.ts`) until
  a page with slug `home` is published.
- Public pages use **ISR** (`export const revalidate = 60`).
- All list/entity blocks ship an **on-brand empty state** so the site looks intentional
  before content exists.

---

## PART 6 — CMS ADMIN

- **Auth** (`/admin/login`) via Supabase Auth + server actions; session refresh in
  `src/lib/supabase/middleware.ts`.
- **Schema-driven entity CRUD** — a **single generic screen** (`EntityManager`) renders
  list + create/edit forms for *every* entity, driven by a declarative field schema
  (`ENTITY_CONFIG` in `src/app/admin/_entities/config.ts`). Field kinds: `text`, `email`,
  `number`, `bool`, `localized`, `url`, `tags`, `date`, `select`, `relation`. Adding an
  entity = adding a config entry (+ its table/migration), **not** a new screen.
- **Page management** (`/admin/pages`): create/rename/slug, set `nav_section` / `nav_order` /
  `parent_id`, publish / unpublish / archive, edit SEO.
- **Live block editor** (`/admin/edit/[slug]`):
  - Block **picker** grouped by category; **dnd-kit** reorder; duplicate / delete.
  - Side-panel forms generated from each block's `EditorSchema`, with **per-locale tabs**
    for localized fields and `showFor` conditional visibility.
  - **Live preview** = an iframe to `/editor-preview/[slug]` rendering the real *draft*
    components (so preview === production output).
  - All mutations go through `'use server'` actions in `src/app/admin/actions/cms.ts`.
- **Lead inbox** (`/admin/inquiries`): list + status management of submissions.

---

## PART 7 — CONVERSION, i18n, MEDIA, SEO, A11Y

**Conversion:** the `inquiry_form` block posts to a `submitInquiry` server action that
(1) validates with zod **including a honeypot** field, (2) inserts a row via the
service-role client, (3) resolves the recipient (explicit → owner → fallback) and sends a
**best-effort Resend** email (a failed email must never fail the submission). Presets may
instead deep-link out (e.g. an "Apply" button → external URL).

**i18n:** locales + routing in `src/i18n/`; UI strings in `messages/<locale>.json`; **all
content** in `jsonb` locale maps. Adding a language = append the locale, add its
`messages/*.json`, provide content — **no data-model change**. Emit `hreflang` alternates
per page.

**Media:** upload with crop (react-easy-crop) to the public bucket; serve via `next/image`.

**SEO:** per-page metadata from `pages.seo`; Open Graph / Twitter tags; appropriate JSON-LD;
generated `sitemap.xml` and `robots.txt`; `hreflang` for all locales.

**Accessibility (target WCAG 2.1 AA):** semantic landmarks, skip link, visible focus, alt
text, `prefers-reduced-motion`; ensure text contrast on accent backgrounds.

---

## PART 8 — PROJECT STRUCTURE (produce this layout)

```
src/
  app/
    [locale]/          Public site (pages, entity detail routes, thank-you, 404)
    admin/             CMS: auth, entity CRUD, page mgmt, live editor, inquiries
      _entities/       EntityManager + ENTITY_CONFIG
      actions/         'use server' actions (auth, cms mutations)
      edit/[slug]/     Live block editor
    editor-preview/    Auth-gated draft preview (rendered in the editor iframe)
    actions/           Public server actions (inquiry submit)
    api/               media proxy + lightweight site search
    sitemap.ts / robots.ts / layout.tsx / not-found.tsx
  components/
    blocks/            Block library + registry.types/meta/tsx + BlockRenderer
    admin/             Editor UI, TipTap rich-text, image crop/upload fields
    layout/            Navbar, Footer, MobileNav, Search, LanguageSwitcher
    ui/                Shared primitives (Section, Cta, Reveal, …)
  lib/
    supabase/          server/client/middleware clients + generated types
    queries.ts         Public data access (pages, nav, entities)
    defaultHome.ts     Built-in home fallback composition
    seo.ts  media.ts  types.ts
  i18n/                next-intl routing + request config
  middleware.ts        Auth gate + locale routing
messages/              UI string catalogues per locale
supabase/
  migrations/          0001… ordered, versioned SQL (schema, RLS, storage, features)
  seed*.ts             Optional, clearly-labelled [Placeholder] seeds (NOT default)
```

Env vars (document in `.env.local.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (**server only**),
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, plus any brief-specific ones.

---

## PART 9 — BUILD ORDER & ACCEPTANCE

Build in phases; each phase should compile and typecheck (`tsc --noEmit`) before the next:

1. **Foundation** — Next 14 + TS + Tailwind + design tokens; next-intl routing + middleware;
   Supabase clients (server/client/middleware).
2. **Database** — `0001` migration: schema, enums, core tables, entity tables, inquiries,
   indexes, `updated_at` triggers, **RLS**, storage bucket. TS type mirror.
3. **Block system** — the four registry files + `BlockRenderer`; 4–6 foundational blocks
   (hero, rich_text, section_header, card_grid, cta_banner, inquiry_form).
4. **Public rendering** — `[locale]/[...slug]` + auto-building nav + default home + ISR.
5. **CMS** — auth; `EntityManager` + `ENTITY_CONFIG`; page management.
6. **Live editor** — block picker, dnd-kit reorder, schema-driven side panel with locale
   tabs, iframe draft preview via `/editor-preview`.
7. **Conversion + comms** — inquiry action (zod + honeypot + Resend), lead inbox.
8. **Remaining blocks** — the full catalogue incl. the **signature code-split block**.
9. **Polish** — SEO (metadata, OG, JSON-LD, sitemap, robots), a11y pass, empty states,
   optional `[Placeholder]` seed, README documenting the "how to add a block/entity/language"
   recipes.

**Definition of done:**
- [ ] A non-technical editor can create a page, add/reorder/duplicate/delete blocks, edit
      content in every locale, and publish — **without a redeploy** — and the public page
      matches the editor preview exactly.
- [ ] Navigation, home page, and entity blocks populate automatically from published/active
      records; unpublished content is invisible to the public (enforced by **RLS**, not just
      the UI).
- [ ] Adding a new language requires no schema change; adding a block/entity follows the
      documented recipe.
- [ ] Lead submissions validate (with honeypot), persist, and notify — and never fail on a
      mail error.
- [ ] `tsc --noEmit` and `next build` pass; Lighthouse/a11y targets met; secrets never reach
      the client.

---

### Guardrails for the agent
- Keep the block **registry split** (types / meta / tsx / renderer) — do not merge the
  component map into the metadata file.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code; use it only in a
  `createAdminClient()` helper in trusted server paths.
- Store **all** translatable content as locale-map JSONB from day one, even for a
  single-language launch.
- Enforce visibility in **RLS**, and treat the UI as a convenience, not the security
  boundary.
- Ship **versioned, re-runnable** migrations (drop-if-exists guards on policies/triggers).
```
