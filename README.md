# Petra Christian University — International Office website

Public website + custom block-based CMS for the **International Office (IO)** of
**Petra Christian University (PETRA)**, Surabaya. Next.js 14 (App Router) ·
TypeScript · Tailwind · next-intl (en/id, zh-ready) · Supabase · Resend.

> Per the client brief, **no real content is seeded.** Every list/entity block
> ships with an on-brand empty state. An optional, clearly-labelled placeholder
> seed exists but is **not run** by default.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev                        # http://localhost:3000  (redirects to /en)
```

- Public site: `/en`, `/id`
- Admin: `/admin` (Supabase Auth — create a user in the Supabase dashboard)

### Environment (`.env.local`)
See `.env.local.example`. You need the Supabase URL + anon key (public), the
service-role key (server-only: seed + inquiry routing), Resend key, and the
outbound Admissions URL.

## Supabase setup (schema isolation is mandatory)

The Supabase project `nvwwkehglccokobxwelp` is **shared** with another brand, so
**every PETRA table lives in a dedicated `petra_io` schema — never `public`.**

1. Run the migration in `supabase/migrations/0001_petra_io_schema.sql`
   (SQL editor, or `supabase db push`). It creates the schema, enums, tables,
   RLS policies, triggers, and a public `petra-io-media` storage bucket.
2. **Expose the schema to the API:** Supabase Dashboard → *Project Settings →
   API → Exposed schemas* → add `petra_io`. The clients are pinned to it via
   `db: { schema: 'petra_io' }`.
3. Create an admin user: *Authentication → Users → Add user*. Any authenticated
   user has full CRUD via RLS.

RLS summary: the public (anon) role may read only **published** pages/blocks and
active entities, and may **insert** into `inquiries`. Authenticated admins have
full CRUD.

## Fonts

Self-hosted via `@font-face` (see `public/fonts/README.md`). Drop the **provided**
licensed font files (Bebas Neue, DIN Condensed, Inter, Baskerville) into
`public/fonts/`. Until then the site falls back to system fonts.

## How it fits together

- **18-block library** — `src/components/blocks/`. `registry.meta.ts` holds the
  component-free metadata (labels, editor schemas, defaults); `registry.tsx`
  maps types → components. `<BlockRenderer>` renders the same components for both
  the public page and the editor preview.
- **Pages & nav** — navigation auto-builds from **published** pages grouped by
  `nav_section`, ordered by `nav_order` (`src/lib/queries.ts`). The home page
  falls back to a built-in default composition until a `home` page is published
  (`src/lib/defaultHome.ts`).
- **Admin** (`/admin`) — auth, entity CRUD (staff/programs/partners/news/
  testimonials via a schema-driven generic screen), page management, inquiry inbox.
- **Live editor** (`/admin/edit/[slug]`) — block picker, dnd-kit reorder,
  duplicate/delete, side-panel schema forms with EN/ID tabs, save & publish. The
  live preview is an iframe to `/editor-preview/[slug]` rendering the real (draft)
  components.
- **Inquiries** — `inquiry_form` block → server action inserts to `inquiries`
  **and** sends a Resend notification to the owning staff member; student preset
  links out to Admissions.
- **Signature feature** — the interactive `partner_map` (react-simple-maps),
  code-split out of the public critical path.

## Optional placeholder seed (NOT run by default)

```bash
npm run db:seed   # inserts clearly-labelled "[Placeholder]" rows; delete in admin
```

## Build / deploy

```bash
npm run build && npm run start
```

ISR is enabled on public pages. Deploy to Vercel; set the same env vars there.

### Note on Node 24

Node 24's `fs.readlink` returns `EISDIR` (instead of `EINVAL`) for regular files,
which crashes Next 14's bundled webpack during `next build`. The `dev`/`build`
scripts preload `scripts/patch-readlink.cjs` (via `NODE_OPTIONS`) to normalise
the error code. On Node 18/20 the shim is a harmless no-op — prefer Node 20 LTS
in CI if you can.

## i18n / future `zh`

Locales live in `src/i18n/routing.ts` and `messages/*.json`. All translatable
content is stored as JSONB locale maps `{ en, id }`. To add Chinese later: append
`'zh'` to `locales`, add `messages/zh.json`, and provide `zh` content — no rebuild
of the data model. hreflang alternates are already emitted per page.

## Accessibility & SEO

WCAG 2.1 AA targeted: semantic landmarks, skip link, visible focus, alt text,
`prefers-reduced-motion`. Amber/cyan accents always use dark text. Per-page SEO
from `pages.seo`, Open Graph/Twitter tags, JSON-LD `EducationalOrganization`,
generated `sitemap.xml` + `robots.txt`, hreflang for en/id.
