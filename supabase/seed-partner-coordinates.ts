/**
 * Seed lat/lng for partners from their country.
 *
 * Each partner is placed near its country's representative point (capital /
 * main city). Partners that share a country are fanned out in a deterministic
 * "sunflower" spiral so the markers don't stack on a single pixel on the
 * partner map. Re-running is safe — the placement is a pure function of the
 * country and the partner's name, so coordinates stay stable.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (read from
 * .env.local automatically). Run with:
 *   npx tsx supabase/seed-partner-coordinates.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv(file: string) {
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* optional */ }
}
loadEnv(resolve(process.cwd(), '.env.local'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// Representative point [lat, lng] per country, keyed by the exact `country`
// string stored on petra_io.partners. Aliases handled in lookup() below.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  Australia: [-33.87, 151.21],
  Bangladesh: [23.81, 90.41],
  Cambodia: [11.56, 104.92],
  Canada: [45.42, -75.7],
  China: [39.9, 116.4],
  France: [48.86, 2.35],
  Germany: [52.52, 13.4],
  'Hong Kong': [22.32, 114.17],
  India: [28.61, 77.21],
  Indonesia: [-6.21, 106.85],
  Japan: [35.68, 139.69],
  Korea: [37.57, 126.98],
  Latvia: [56.95, 24.11],
  Lithuania: [54.69, 25.28],
  Malaysia: [3.14, 101.69],
  Macau: [22.2, 113.54],
  Mongolia: [47.89, 106.91],
  Netherlands: [52.37, 4.9],
  'New Zealand': [-41.29, 174.78],
  Philippines: [14.6, 120.98],
  Poland: [52.23, 21.01],
  Romania: [44.43, 26.1],
  Singapore: [1.35, 103.82],
  Switzerland: [46.95, 7.45],
  Taiwan: [25.03, 121.57],
  Thailand: [13.76, 100.5],
  'Timor-Leste': [-8.56, 125.56],
  UK: [51.51, -0.13],
  'United Arab Emirates (UAE)': [24.47, 54.37],
  USA: [38.9, -77.04],
};

// Aliases / spelling variants -> canonical key above.
const ALIAS: Record<string, string> = {
  'south korea': 'Korea',
  'republic of korea': 'Korea',
  'hongkong': 'Hong Kong',
  uae: 'United Arab Emirates (UAE)',
  'united arab emirates': 'United Arab Emirates (UAE)',
  'united kingdom': 'UK',
  'united states of america': 'USA',
  'united states': 'USA',
  'the netherlands': 'Netherlands',
};

// Smaller spiral radius for island / city-states so markers don't fall far
// offshore. Degrees of spacing between successive markers.
const SMALL = new Set(['Hong Kong', 'Singapore', 'Macau', 'Timor-Leste']);

function lookup(country: string | null): [number, number] | null {
  if (!country) return null;
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  const a = ALIAS[country.trim().toLowerCase()];
  return a ? COUNTRY_COORDS[a] : null;
}

type Row = { id: string; name: string; country: string | null };

// Sunflower placement: the i-th of n partners in a country sits on a spiral
// around the centre. base = degree spacing; golden angle avoids alignment.
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function place(center: [number, number], i: number, base: number): [number, number] {
  if (i === 0) return center;
  const r = base * Math.sqrt(i);
  const a = i * GOLDEN;
  const lat = center[0] + r * Math.sin(a);
  const lng = center[1] + (r * Math.cos(a)) / Math.max(0.3, Math.cos((center[0] * Math.PI) / 180));
  return [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
}

async function main() {
  const supabase = createClient(url!, key!, { db: { schema: 'petra_io' } });

  const { data, error } = await supabase.from('partners').select('id,name,country');
  if (error) { console.error('Read failed:', error.message); process.exit(1); }
  const rows = (data ?? []) as Row[];

  // Group by canonical country and sort for deterministic spiral order.
  const groups = new Map<string, Row[]>();
  const unknown = new Map<string, number>();
  for (const r of rows) {
    const center = lookup(r.country);
    if (!center) { unknown.set(r.country ?? '(null)', (unknown.get(r.country ?? '(null)') ?? 0) + 1); continue; }
    const canonical = COUNTRY_COORDS[r.country!] ? r.country! : ALIAS[(r.country ?? '').trim().toLowerCase()];
    const list = groups.get(canonical) ?? [];
    list.push(r);
    groups.set(canonical, list);
  }

  const updates: { id: string; lat: number; lng: number }[] = [];
  for (const [country, list] of groups) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    const center = COUNTRY_COORDS[country];
    const base = SMALL.has(country) ? 0.08 : 0.32;
    list.forEach((r, i) => {
      const [lat, lng] = place(center, i, base);
      updates.push({ id: r.id, lat, lng });
    });
  }

  console.log(`Partners: ${rows.length}. Placing ${updates.length} across ${groups.size} countries.`);
  if (unknown.size) {
    console.log('No coordinates for (skipped):');
    for (const [c, n] of unknown) console.log(`  ${n}\t${c}`);
  }

  let done = 0;
  for (const u of updates) {
    const { error: upErr } = await supabase.from('partners').update({ lat: u.lat, lng: u.lng }).eq('id', u.id);
    if (upErr) { console.error(`Update ${u.id} failed:`, upErr.message); process.exit(1); }
    if (++done % 25 === 0) console.log(`Updated ${done}/${updates.length}`);
  }
  console.log(`Done. Updated ${done} partners with coordinates.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
