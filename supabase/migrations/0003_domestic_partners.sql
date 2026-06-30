-- ----------------------------------------------------------------------------
-- Domestic (Indonesian) partners — an INDEPENDENT table, separate from
-- petra_io.partners (which now holds international partners only).
-- Keyed by City instead of country.
-- ----------------------------------------------------------------------------
create table if not exists petra_io.domestic_partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  region      text,
  logo_url    text,
  url         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists domestic_partners_city_idx on petra_io.domestic_partners (city);

-- updated_at trigger (reuses the shared function from 0001)
drop trigger if exists set_updated_at on petra_io.domestic_partners;
create trigger set_updated_at before update on petra_io.domestic_partners
  for each row execute function petra_io.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security: public read, authenticated admin full CRUD
--   (mirrors petra_io.partners)
-- ----------------------------------------------------------------------------
alter table petra_io.domestic_partners enable row level security;

drop policy if exists "public read domestic_partners" on petra_io.domestic_partners;
create policy "public read domestic_partners" on petra_io.domestic_partners
  for select to anon using (true);

drop policy if exists "admin all domestic_partners" on petra_io.domestic_partners;
create policy "admin all domestic_partners" on petra_io.domestic_partners
  for all to authenticated using (true) with check (true);

grant select on petra_io.domestic_partners to anon;
grant all on petra_io.domestic_partners to authenticated, service_role;
