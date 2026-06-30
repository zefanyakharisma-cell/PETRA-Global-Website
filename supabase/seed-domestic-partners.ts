/**
 * Seed ACTIVE domestic (Indonesian) partners into petra_io.domestic_partners
 * — a table INDEPENDENT of petra_io.partners (which holds international only).
 *
 * Source : assets/Data/Domestic Partners.csv
 * Criteria:
 *   1. Active on/after 2026-06-29 (end date in the future, "No Limit",
 *      "years to come", open-ended auto-renew, or an undetermined end date).
 *   2. Has a MoU and/or MoA (IA-only agreements are excluded).
 *   3. One row per institution — multiple agreements merged; the trailing
 *      city suffix is stripped from the display name (e.g. "X, Surabaya" -> "X")
 *      and stored in the `city` column.
 *
 * Requires the petra_io.domestic_partners table (migration 0003).
 * Idempotent: skips any domestic partner whose name already exists.
 * Run with:  npx tsx supabase/seed-domestic-partners.ts
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
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const TODAY = new Date('2026-06-29T00:00:00Z');
const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function parseDate(s: string): Date | null {
  if (!s) return null; s = s.trim();
  let m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (m) { const d = +m[1]; const mo = MONTHS[m[2].toLowerCase()]; if (mo === undefined) return null; let y = +m[3]; if (m[3].length === 2) y = y <= 49 ? 2000 + y : 1900 + y; return new Date(Date.UTC(y, mo, d)); }
  m = s.match(/^(\d{4})$/);
  if (m) return new Date(Date.UTC(+m[1], 11, 31));
  return null;
}
const isTrue = (v: string) => ['TRUE', '1', 'YES'].includes((v || '').trim().toUpperCase());
const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

function normSeg(seg: string): string {
  let s = seg.trim().toLowerCase();
  s = s.replace(/\([^)]*\)/g, '').trim();
  s = s.replace(/^(the|rep\.?\s+of|republic\s+of)\s+/, '').trim();
  s = s.replace(/[.\s]+$/, '').trim();
  return s;
}
// strip a trailing ", <City>" when it matches this row's Kota value
function stripCity(name: string, kota: string): string {
  const target = normSeg(kota);
  if (!target) return name;
  const i = name.lastIndexOf(',');
  if (i < 0) return name;
  if (normSeg(name.slice(i + 1)) === target) return name.slice(0, i).replace(/[\s,]+$/, '').trim();
  return name;
}

type Partner = { name: string; city: string | null };

function buildPartners(): Partner[] {
  const rows = parseCSV(readFileSync(resolve(process.cwd(), 'assets/Data/Domestic Partners.csv'), 'utf8'));
  const header = rows[0];
  const idx = (label: string) => header.findIndex((x) => x && x.trim() === label);
  const I = { inst: idx('Partner Instansi'), kota: idx('Kota'), mou: idx('MoU'), moa: idx('MoA'), ber: idx('Tgl Berakhir'), ar: header.findIndex((x) => x && /Auto Renewed/i.test(x)) };
  const data = rows.filter((r) => /^\d+$/.test((r[0] || '').trim()));

  const groups = new Map<string, Partner>();
  for (const r of data) {
    const raw = norm(r[I.inst]); if (!raw) continue;
    const hasMoU = isTrue(r[I.mou]); const hasMoA = isTrue(r[I.moa]);
    if (!hasMoU && !hasMoA) continue;

    const ber = (r[I.ber] || '').trim(); const ar = (r[I.ar] || '').trim();
    const blob = `${ber} ${ar}`.toLowerCase();
    let active: boolean;
    if (/no limit|years to come/.test(blob)) active = true;
    else if (/auto renew/.test(ber)) { const ad = parseDate(ar); active = ad ? ad >= TODAY : true; }
    else { const d = [parseDate(ber), parseDate(ar)].filter(Boolean).sort((a, b) => +b! - +a!)[0]; active = d ? d >= TODAY : true; }
    if (!active) continue;

    const city = norm(r[I.kota]) || null;
    const name = stripCity(raw, norm(r[I.kota]));
    const key = name.toLowerCase();                 // group by stripped name (merges city-variants)
    if (!groups.has(key)) groups.set(key, { name, city });
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const supabase = createClient(url!, key!, { db: { schema: 'petra_io' } });
  const partners = buildPartners();
  console.log(`Built ${partners.length} active domestic institutions from CSV.`);

  const { data: existing, error: exErr } = await supabase.from('domestic_partners').select('name');
  if (exErr) { console.error('Read existing failed:', exErr.message, '\n(Did you apply migration 0003_domestic_partners.sql?)'); process.exit(1); }
  const have = new Set((existing ?? []).map((p: { name: string }) => p.name));
  const toInsert = partners.filter((p) => !have.has(p.name));
  console.log(`${have.size} already present; inserting ${toInsert.length} new rows.`);
  if (toInsert.length === 0) { console.log('Nothing to insert. Done.'); return; }

  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await supabase.from('domestic_partners').insert(batch);
    if (error) { console.error(`Batch ${i / 100 + 1} failed:`, error.message); process.exit(1); }
    console.log(`Inserted ${Math.min(i + 100, toInsert.length)}/${toInsert.length}`);
  }
  console.log('Done seeding domestic partners.');
}

main().catch((e) => { console.error(e); process.exit(1); });
