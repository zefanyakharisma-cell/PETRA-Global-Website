# Petra Christian University — International Office Website & CMS

## Outcome

A fully bilingual (English / Indonesian, Chinese-ready) public marketing website for the International Office (IO) of Petra Christian University (PETRA), Surabaya — backed by a custom, block-based content management system. Every page is composed from a library of reusable content blocks, and non-technical editors manage the entire site through a live, drag-and-drop visual editor at `/admin`, with schema-driven CRUD for staff, programs, partners, news, faculties and more. Content publishes without a redeploy thanks to incremental static regeneration.

## Problem Arise (Why This Project Is Important)

The International Office is the university's front door to the world — the primary channel for prospective international students, inbound/outbound mobility, and global partnership institutions. Yet its web presence needed to be:

- **Bilingual and future-proof for a third language.** International audiences (English) and domestic stakeholders (Indonesian) must be served equally, with Chinese ready to add later without re-engineering.
- **Editable by the office itself, not developers.** Program details, partner lists, news and staff change constantly; routing every edit through a developer is slow and expensive.
- **Consistent and on-brand across dozens of pages.** Hand-coded pages drift in layout and quality. A shared block system guarantees a coherent look while still allowing rich, varied page compositions.
- **Trustworthy for recruitment.** Prospective students and partner universities judge credibility by the site — it must be fast, accessible, SEO-strong, and able to capture and route inquiries reliably.

This project solves all four by pairing a polished public site with a purpose-built CMS the office controls end-to-end.

## Purpose of This Project

To give Petra's International Office a self-managed, multilingual digital platform that presents its programs, partnerships, and people to a global audience — and to empower staff to keep that platform current through an intuitive visual editor, without ongoing developer involvement.

## Features

- **Block-based page builder** — ~27 reusable block types (hero, rich text, image/text splits, stat strips, card grids, accordions, tabs, timelines, galleries, logo walls, CTA banners, and more) assembled into any page layout.
- **Live drag-and-drop editor** — reorder, duplicate, and delete blocks with dnd-kit; side-panel forms generated per block; live iframe preview of the real draft.
- **Full bilingual content (EN / ID)** — all translatable content stored as JSONB locale maps; per-field EN/ID editing tabs; Chinese can be added with no data-model change; hreflang alternates emitted automatically.
- **Auto-building navigation** — menus construct themselves from published pages grouped by section and nested via parent/child hierarchy into dropdown → flyout menus.
- **Schema-driven entity CRUD** — a single generic admin screen manages staff, programs, partners, domestic partners, news, testimonials, faculties, study programs, and courses.
- **Interactive partner world map** — the signature block, code-split out of the critical path for performance.
- **Inquiry capture & routing** — validated inquiry forms (with honeypot spam protection) that store submissions and send best-effort email notifications to the right recipient.
- **Rich-text editing** — TipTap editor with links, highlights, alignment, and styling.
- **Media management** — image upload with cropping to a public storage bucket, served through optimized `next/image`.
- **Row-Level Security** — public reads see only published content; authenticated admins get full CRUD; server-only operations bypass RLS safely.
- **SEO & accessibility built in** — per-page metadata, Open Graph/Twitter tags, JSON-LD, generated sitemap & robots, WCAG 2.1 AA targets (semantic landmarks, skip links, focus states, reduced-motion support).
- **News, programs, and empty-state design** — dedicated news and program detail routes; on-brand empty states so the site looks intentional before content is seeded.

## Tech Stack

### Frontend
- **Next.js 14** (App Router, React Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS** with design tokens
- **next-intl** for internationalization (en, id, zh-ready)
- **framer-motion** for animation
- **TipTap** (rich-text editing) · **dnd-kit** (drag-and-drop)
- **react-simple-maps** / **maplibre-gl** (partner map)
- **react-hook-form** + **zod** (forms & validation)

### Backend
- **Next.js Server Actions & Route Handlers** (server-side data mutations, inquiry submission, media proxy, site search)
- **Supabase Auth** (admin authentication & session handling)
- **Resend** (transactional inquiry-notification email)
- **zod** (server-side validation)

### Database
- **Supabase (PostgreSQL)** — dedicated `petra_io` schema, Row-Level Security policies, `updated_at` triggers, and versioned SQL migrations
- **Supabase Storage** — public-read `petra-io-media` bucket for uploads
- Localized content stored as **JSONB locale maps** (`{ en, id }`)

### Hosting
- **Vercel** — production hosting with **Incremental Static Regeneration (ISR)** so published content propagates without a redeploy
- **Supabase** — managed Postgres, Auth, and Storage backend
