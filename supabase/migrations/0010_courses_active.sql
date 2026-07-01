-- ----------------------------------------------------------------------------
-- Give courses the same archive lifecycle as faculties & study_programs.
--   Archived (is_active = false) rows stay in the admin so they can be restored,
--   but are hidden from the public academics explorer.
-- ----------------------------------------------------------------------------

alter table petra_io.courses
  add column if not exists is_active boolean not null default true;

create index if not exists courses_active_idx on petra_io.courses (is_active);

-- Match the faculties / study_programs pattern: anon only reads active rows.
drop policy if exists "public read courses" on petra_io.courses;
create policy "public read active courses" on petra_io.courses
  for select to anon using (is_active = true);
