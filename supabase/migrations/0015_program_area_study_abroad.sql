-- ----------------------------------------------------------------------------
-- Add 'study_abroad' as a program area so a study program can list its
-- Study Abroad items alongside Courses, Joint Degree, Double Degree,
-- International Internship and Accreditation. Widens the courses_area_check
-- constraint; all areas keep reusing petra_io.courses (identical shape,
-- distinguished by `area`).
-- ----------------------------------------------------------------------------

alter table petra_io.courses
  drop constraint if exists courses_area_check;

alter table petra_io.courses
  add constraint courses_area_check
  check (area in ('course', 'joint_degree', 'double_degree', 'study_abroad', 'international_internship', 'accreditation'));
