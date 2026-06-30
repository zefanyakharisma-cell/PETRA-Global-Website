-- ----------------------------------------------------------------------------
-- partner_marquee : scrolling rows of partner logos pulled from the database.
--   The block's `config.filterKind` chooses which network is shown
--   (all / international / domestic). Entity-bound, no new tables — it reads the
--   existing petra_io.partners and petra_io.domestic_partners logo_url columns.
-- `add value` cannot run inside a txn that later uses the value, so it lands on
-- its own (idempotent) statement.
-- ----------------------------------------------------------------------------

alter type petra_io.block_type add value if not exists 'partner_marquee';
