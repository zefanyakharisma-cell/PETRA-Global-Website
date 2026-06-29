-- ============================================================================
-- PETRA International Office — schema, tables, RLS, storage
-- Project nvwwkehglccokobxwelp is SHARED with another brand. EVERYTHING for
-- PETRA lives in the dedicated `petra_io` schema. Nothing goes in `public`.
-- ============================================================================

create schema if not exists petra_io;

-- Expose the schema to PostgREST / the Supabase JS client (db.schema = 'petra_io').
-- NOTE: you must also add `petra_io` to "Exposed schemas" in
-- Project Settings -> API (search_path), or run the ALTER below if you control roles.
grant usage on schema petra_io to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Extensions & helpers
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

create or replace function petra_io.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type petra_io.nav_section as enum ('about','mobility','partnership','life','news','none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.page_status as enum ('draft','published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.program_kind as enum ('inbound','outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.partner_kind as enum ('international','domestic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.inquiry_kind as enum ('student','partner','outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.inquiry_status as enum ('new','in_progress','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type petra_io.block_type as enum (
    'hero','section_header','audience_doors','rich_text','image_text_split',
    'stat_strip','card_grid','accordion','steps','gallery','pull_quote',
    'logo_wall','embed','partner_map','testimonials','news_feed','staff','inquiry_form'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Entities
-- ----------------------------------------------------------------------------
create table if not exists petra_io.staff (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  photo_url   text,
  role        jsonb not null default '{}'::jsonb, -- { "en": "...", "id": "..." }
  area        jsonb not null default '{}'::jsonb,
  email       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists petra_io.programs (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  kind           petra_io.program_kind not null,
  title          jsonb not null default '{}'::jsonb,
  summary        jsonb not null default '{}'::jsonb,
  cost           jsonb not null default '{}'::jsonb, -- per-program; each differs
  duration       text,
  owner_staff_id uuid references petra_io.staff(id) on delete set null,
  is_featured    boolean not null default false,
  cover_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists petra_io.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  country     text,
  lat         double precision,
  lng         double precision,
  kind        petra_io.partner_kind not null default 'international',
  region      text,
  logo_url    text,
  url         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists petra_io.news (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         jsonb not null default '{}'::jsonb,
  body          jsonb not null default '{}'::jsonb, -- rich text per locale
  tags          text[] not null default '{}',      -- subset of inbound|outbound|partnership
  published_at  timestamptz,
  cover_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists petra_io.testimonials (
  id           uuid primary key default gen_random_uuid(),
  quote        jsonb not null default '{}'::jsonb,
  person_name  text not null,
  country      text,
  program_id   uuid references petra_io.programs(id) on delete set null,
  photo_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists petra_io.inquiries (
  id                  uuid primary key default gen_random_uuid(),
  kind                petra_io.inquiry_kind not null,
  payload             jsonb not null default '{}'::jsonb,
  program_id          uuid references petra_io.programs(id) on delete set null,
  recipient_staff_id  uuid references petra_io.staff(id) on delete set null,
  status              petra_io.inquiry_status not null default 'new',
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CMS core: pages + blocks
-- ----------------------------------------------------------------------------
create table if not exists petra_io.pages (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          jsonb not null default '{}'::jsonb,
  nav_section    petra_io.nav_section not null default 'none',
  nav_order      int not null default 0,
  parent_id      uuid references petra_io.pages(id) on delete set null,
  status         petra_io.page_status not null default 'draft',
  owner_staff_id uuid references petra_io.staff(id) on delete set null,
  seo            jsonb not null default '{}'::jsonb, -- { title, description, og_image_url } per locale
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists petra_io.blocks (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references petra_io.pages(id) on delete cascade,
  type        petra_io.block_type not null,
  position    int not null default 0,
  config      jsonb not null default '{}'::jsonb, -- incl. background + spacing
  content     jsonb not null default '{}'::jsonb, -- translatable block content
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists blocks_page_position_idx on petra_io.blocks (page_id, position);
create index if not exists pages_nav_idx on petra_io.pages (nav_section, nav_order);
create index if not exists programs_kind_idx on petra_io.programs (kind);
create index if not exists news_published_idx on petra_io.news (published_at desc);
create index if not exists news_tags_idx on petra_io.news using gin (tags);
create index if not exists partners_kind_idx on petra_io.partners (kind);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['staff','programs','partners','news','testimonials','pages','blocks']
  loop
    execute format(
      'drop trigger if exists set_updated_at on petra_io.%I;
       create trigger set_updated_at before update on petra_io.%I
         for each row execute function petra_io.set_updated_at();', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security
--   public (anon): read published pages/blocks + active entities; insert inquiries.
--   authenticated (admin): full CRUD.
-- ----------------------------------------------------------------------------
alter table petra_io.staff        enable row level security;
alter table petra_io.programs     enable row level security;
alter table petra_io.partners     enable row level security;
alter table petra_io.news         enable row level security;
alter table petra_io.testimonials enable row level security;
alter table petra_io.inquiries    enable row level security;
alter table petra_io.pages        enable row level security;
alter table petra_io.blocks       enable row level security;

-- Policies use drop-if-exists guards so this migration is safely re-runnable.
-- Public read of active entities ------------------------------------------------
drop policy if exists "public read active staff" on petra_io.staff;
create policy "public read active staff" on petra_io.staff
  for select to anon using (is_active = true);
drop policy if exists "public read programs" on petra_io.programs;
create policy "public read programs" on petra_io.programs
  for select to anon using (true);
drop policy if exists "public read partners" on petra_io.partners;
create policy "public read partners" on petra_io.partners
  for select to anon using (true);
drop policy if exists "public read published news" on petra_io.news;
create policy "public read published news" on petra_io.news
  for select to anon using (published_at is not null and published_at <= now());
drop policy if exists "public read testimonials" on petra_io.testimonials;
create policy "public read testimonials" on petra_io.testimonials
  for select to anon using (true);

-- Public read of published pages + their blocks --------------------------------
drop policy if exists "public read published pages" on petra_io.pages;
create policy "public read published pages" on petra_io.pages
  for select to anon using (status = 'published');
drop policy if exists "public read blocks of published pages" on petra_io.blocks;
create policy "public read blocks of published pages" on petra_io.blocks
  for select to anon using (
    exists (select 1 from petra_io.pages p
            where p.id = blocks.page_id and p.status = 'published')
  );

-- Public may submit inquiries (insert only, no read) ---------------------------
drop policy if exists "public insert inquiries" on petra_io.inquiries;
create policy "public insert inquiries" on petra_io.inquiries
  for insert to anon with check (true);

-- Authenticated admin: full CRUD on everything ---------------------------------
do $$
declare t text;
begin
  foreach t in array array['staff','programs','partners','news','testimonials','inquiries','pages','blocks']
  loop
    execute format('drop policy if exists "admin all %1$s" on petra_io.%1$I;', t);
    execute format(
      'create policy "admin all %1$s" on petra_io.%1$I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Table privileges (RLS still governs row visibility) --------------------------
grant select on all tables in schema petra_io to anon;
grant insert on petra_io.inquiries to anon;
grant all on all tables in schema petra_io to authenticated, service_role;
alter default privileges in schema petra_io
  grant select on tables to anon;
alter default privileges in schema petra_io
  grant all on tables to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Storage buckets (public-read media for the CMS)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('petra-io-media', 'petra-io-media', true)
on conflict (id) do nothing;

-- Public can read media; only authenticated admins can write.
-- (Scoped to the petra-io-media bucket so the shared project's storage is untouched.)
drop policy if exists "petra-io media public read" on storage.objects;
create policy "petra-io media public read" on storage.objects
  for select to anon using (bucket_id = 'petra-io-media');
drop policy if exists "petra-io media admin write" on storage.objects;
create policy "petra-io media admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'petra-io-media')
  with check (bucket_id = 'petra-io-media');
