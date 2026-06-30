-- Add an 'archived' lifecycle state to pages.
-- Archived pages are hidden from the public site (queries filter status='published')
-- but kept out of the way in the admin so they can be restored later.
alter type petra_io.page_status add value if not exists 'archived';
