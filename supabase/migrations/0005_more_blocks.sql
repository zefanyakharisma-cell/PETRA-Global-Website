-- ----------------------------------------------------------------------------
-- More CMS block options.
--   * divider      : structural breather (hairline / dots / empty space).
--   * feature_list : icon + title + blurb grid (benefits, services).
--   * tabs         : tabbed content panels.
--   * timeline     : chronological milestones (history, deadlines).
--   * cta_banner   : focused call-to-action band.
-- Content-only blocks — no new entity tables, just new block_type enum values.
-- enum values are committed implicitly; `add value` cannot run inside a txn that
-- later uses the value, so each lands on its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'divider';
alter type petra_io.block_type add value if not exists 'feature_list';
alter type petra_io.block_type add value if not exists 'tabs';
alter type petra_io.block_type add value if not exists 'timeline';
alter type petra_io.block_type add value if not exists 'cta_banner';
