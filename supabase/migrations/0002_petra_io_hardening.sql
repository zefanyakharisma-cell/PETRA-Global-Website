-- ============================================================================
-- PETRA International Office — security hardening (addresses advisor warnings)
-- ============================================================================

-- 1) Pin the trigger function's search_path (advisor: function_search_path_mutable).
alter function petra_io.set_updated_at() set search_path = pg_catalog, pg_temp;

-- 2) The `petra-io-media` bucket is public, so objects are already served via
--    their public URL without a SELECT policy. The broad anon SELECT policy only
--    added the ability to LIST every file (advisor: public_bucket_allows_listing).
--    Drop it; admin write (ALL) still covers authenticated listing/management.
drop policy if exists "petra-io media public read" on storage.objects;

-- NOTE (shared project): the `admin all <table>` policies grant full CRUD to ANY
-- `authenticated` role. Because this Supabase project is shared with another
-- brand, "authenticated" can include that brand's users. If that is a concern,
-- introduce a `petra_io.admins(user_id uuid primary key)` allowlist and change
-- each admin policy's USING/WITH CHECK to
--   (auth.uid() in (select user_id from petra_io.admins))
-- This is intentionally left as a deployment decision, not applied here.
