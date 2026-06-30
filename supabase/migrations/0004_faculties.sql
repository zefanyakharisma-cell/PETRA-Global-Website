-- ----------------------------------------------------------------------------
-- Academics: faculties -> study programs -> courses.
--   * faculties      : top-level academic units, each with its own website.
--   * study_programs : belong to a faculty, each with its own website.
--   * courses        : belong to a study program (entered manually later).
-- Mirrors the existing entity pattern (localized jsonb name/description, RLS:
-- public read active rows, authenticated admin full CRUD).
-- ----------------------------------------------------------------------------

-- New block type for the public "Faculties & programs" explorer block.
alter type petra_io.block_type add value if not exists 'faculties';

-- Faculties -------------------------------------------------------------------
create table if not exists petra_io.faculties (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        jsonb not null default '{}'::jsonb, -- { "en": "...", "id": "..." }
  tagline     jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  url         text,                               -- faculty's own website
  logo_url    text,
  cover_url   text,
  accent      text not null default 'magenta',    -- magenta | blue | amber | cyan
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Study programs --------------------------------------------------------------
create table if not exists petra_io.study_programs (
  id          uuid primary key default gen_random_uuid(),
  faculty_id  uuid references petra_io.faculties(id) on delete cascade,
  slug        text not null unique,
  name        jsonb not null default '{}'::jsonb,
  degree      text,                               -- e.g. "Bachelor (S1)", "Master (S2)"
  description jsonb not null default '{}'::jsonb,
  url         text,                               -- study program's own website
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Courses (entered manually later) --------------------------------------------
create table if not exists petra_io.courses (
  id                uuid primary key default gen_random_uuid(),
  study_program_id  uuid references petra_io.study_programs(id) on delete cascade,
  code              text,
  name              jsonb not null default '{}'::jsonb,
  credits           int,
  semester          text,
  description       jsonb not null default '{}'::jsonb,
  position          int  not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists study_programs_faculty_idx on petra_io.study_programs (faculty_id, position);
create index if not exists courses_program_idx on petra_io.courses (study_program_id, position);
create index if not exists faculties_position_idx on petra_io.faculties (position);

-- updated_at triggers (reuse the shared function from 0001)
do $$
declare t text;
begin
  foreach t in array array['faculties','study_programs','courses']
  loop
    execute format(
      'drop trigger if exists set_updated_at on petra_io.%I;
       create trigger set_updated_at before update on petra_io.%I
         for each row execute function petra_io.set_updated_at();', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security: public read, authenticated admin full CRUD
-- ----------------------------------------------------------------------------
alter table petra_io.faculties      enable row level security;
alter table petra_io.study_programs enable row level security;
alter table petra_io.courses        enable row level security;

drop policy if exists "public read active faculties" on petra_io.faculties;
create policy "public read active faculties" on petra_io.faculties
  for select to anon using (is_active = true);
drop policy if exists "public read active study_programs" on petra_io.study_programs;
create policy "public read active study_programs" on petra_io.study_programs
  for select to anon using (is_active = true);
drop policy if exists "public read courses" on petra_io.courses;
create policy "public read courses" on petra_io.courses
  for select to anon using (true);

do $$
declare t text;
begin
  foreach t in array array['faculties','study_programs','courses']
  loop
    execute format('drop policy if exists "admin all %1$s" on petra_io.%1$I;', t);
    execute format(
      'create policy "admin all %1$s" on petra_io.%1$I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

grant select on petra_io.faculties, petra_io.study_programs, petra_io.courses to anon;
grant all on petra_io.faculties, petra_io.study_programs, petra_io.courses to authenticated, service_role;
