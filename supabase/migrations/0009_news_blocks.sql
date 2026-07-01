-- ----------------------------------------------------------------------------
-- News gets block-based bodies, mirroring pages.
--   A block now belongs to EITHER a page or a news article (exactly one).
--   Public /news/[slug] renders these blocks; the editor is the same one
--   used for pages.
-- ----------------------------------------------------------------------------
set search_path = petra_io, public;

-- Blocks may now hang off a news article instead of a page.
alter table petra_io.blocks alter column page_id drop not null;
alter table petra_io.blocks
  add column if not exists news_id uuid references petra_io.news(id) on delete cascade;

-- Exactly one owner per block.
alter table petra_io.blocks drop constraint if exists blocks_one_owner;
alter table petra_io.blocks add constraint blocks_one_owner
  check ((page_id is not null)::int + (news_id is not null)::int = 1);

create index if not exists blocks_news_position_idx on petra_io.blocks (news_id, position);

-- Public read of blocks belonging to a published news article (published_at set
-- and not in the future), alongside the existing published-pages policy.
drop policy if exists "public read blocks of published news" on petra_io.blocks;
create policy "public read blocks of published news" on petra_io.blocks
  for select to anon using (
    exists (
      select 1 from petra_io.news n
      where n.id = blocks.news_id
        and n.published_at is not null
        and n.published_at <= now()
    )
  );
