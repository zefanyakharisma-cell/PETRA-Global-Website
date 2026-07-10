-- ----------------------------------------------------------------------------
-- directions : navigation map block. Renders an embedded Google directions map
--   from an origin to a destination (travel mode configurable) inside a styled
--   route card — shows the route + travel time between two places.
--   Content-only — no new tables, just a new block_type enum value.
-- `add value` cannot run inside a txn that later uses the value, so it lands on
-- its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'directions';
