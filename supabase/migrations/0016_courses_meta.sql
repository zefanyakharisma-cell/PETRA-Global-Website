-- ----------------------------------------------------------------------------
-- Per-area attributes for program items. All six areas share petra_io.courses,
-- but the non-course areas (Double Degree, Joint Degree, Accreditation,
-- Study Abroad, International Internship) need attributes that don't fit the
-- course-centric columns (code / credits / semester): partner or host
-- institution, country, degrees/grade awarded, duration, term/validity.
--
-- A single flexible `meta` jsonb column holds these so each area can be
-- described and presented properly without per-area columns or constraint
-- churn. Admin writes a small vocabulary of keys (institution, country,
-- credential, duration, detail); the explorer reads them back.
-- ----------------------------------------------------------------------------

alter table petra_io.courses
  add column if not exists meta jsonb not null default '{}'::jsonb;
