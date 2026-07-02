-- ----------------------------------------------------------------------------
-- Program areas: let a "course" row belong to one of several tracks so a study
-- program can list Courses, Joint Degree, Double Degree and International
-- Internship items side by side. All four reuse petra_io.courses (identical
-- shape); the `area` column distinguishes them. Existing rows become 'course'.
-- ----------------------------------------------------------------------------

alter table petra_io.courses
  add column if not exists area text not null default 'course';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_area_check'
  ) then
    alter table petra_io.courses
      add constraint courses_area_check
      check (area in ('course', 'joint_degree', 'double_degree', 'international_internship'));
  end if;
end $$;

-- The explorer filters by (study_program_id, area) then orders by position.
create index if not exists courses_program_area_idx
  on petra_io.courses (study_program_id, area, position);
