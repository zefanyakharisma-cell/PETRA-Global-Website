-- ----------------------------------------------------------------------------
-- Two more CMS block types:
--   * downloads : list of downloadable documents (brochures, fact sheets, MoUs).
--   * events    : chronological events / key dates (open days, webinars, deadlines).
-- Content-only blocks — no new entity tables, just new block_type enum values.
-- `add value` cannot run inside a txn that later uses the value, so each lands
-- on its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'downloads';
alter type petra_io.block_type add value if not exists 'events';
