-- ----------------------------------------------------------------------------
-- chart : data-visualisation block (bar / line / area / pie / donut / KPI).
--   Editors supply data three ways — a manual grid, an uploaded Excel/CSV, or
--   an aggregated query over an allowlisted table (see src/lib/chartSources.ts).
--   Content-only — no new tables, just a new block_type enum value.
-- `add value` cannot run inside a txn that later uses the value, so it lands on
-- its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'chart';
