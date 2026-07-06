-- ----------------------------------------------------------------------------
-- block_presets : editor-saved reusable sections. A preset stores one or more
--   blocks as an ordered payload of `{ type, config, content }` objects, so an
--   admin can save any block (or a built-up section) and re-insert it on another
--   page. Admin-only — never read by the public site.
-- ----------------------------------------------------------------------------
create table if not exists petra_io.block_presets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Ordered array of block seeds: [{ "type", "config", "content" }, ...].
  payload     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists block_presets_created_idx on petra_io.block_presets (created_at desc);

-- updated_at trigger (reuses the shared function from 0001)
drop trigger if exists set_updated_at on petra_io.block_presets;
create trigger set_updated_at before update on petra_io.block_presets
  for each row execute function petra_io.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security: authenticated admins only (no anon access at all).
-- ----------------------------------------------------------------------------
alter table petra_io.block_presets enable row level security;

drop policy if exists "admin all block_presets" on petra_io.block_presets;
create policy "admin all block_presets" on petra_io.block_presets
  for all to authenticated using (true) with check (true);

grant all on petra_io.block_presets to authenticated, service_role;
