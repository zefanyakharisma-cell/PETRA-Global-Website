-- ----------------------------------------------------------------------------
-- map : interactive MapLibre location map block.
--   Editors add markers (label + lat/lng) in the block's `content`; `config`
--   chooses style/height/zoom and whether to draw a route line between markers.
--   Content-only — no new tables, just a new block_type enum value.
-- `add value` cannot run inside a txn that later uses the value, so it lands on
-- its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'map';
