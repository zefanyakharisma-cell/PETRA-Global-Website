/**
 * Build the CMS-driven /partnership page: one petra_io.pages row + its blocks.
 *
 * The page is composed entirely of existing block types so it renders through
 * the standard [slug] route + BlockRenderer (no bespoke React route):
 *   hero -> stat_strip -> partner_map(international) -> logo_wall(marquee)
 *           [-> partner_map(domestic) when domestic partners exist]
 *
 * The marquee block (logo_wall with config.layout='marquee') carries an enriched
 * `content.partners` array — name, country, logo, agreement expiry, and the
 * cooperating faculties/study programs — parsed from the source CSV. Clicking a
 * logo opens a popup with those details. The data lives in block content because
 * the partners table has no column for programs/expiry.
 *
 * Idempotent: re-running replaces the partnership page's blocks in place.
 * Run with:  npx tsx supabase/seed-partnership-page.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { partnerLogo } from '../src/lib/partnerLogos';

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

// ---- CSV parsing -----------------------------------------------------------
function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', inQ = false;
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
  m = s.match(/^(\d{4})$/); if (m) return new Date(Date.UTC(+m[1], 11, 31));
  return null;
}
const isTrue = (v: string) => ['TRUE', '1', 'YES'].includes((v || '').trim().toUpperCase());
const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

// Country-suffix stripping — identical to seed-international-partners.ts so the
// display names line up with the rows already in petra_io.partners.
const COUNTRY_ALIASES = new Set(['australia', 'thailand', 'malaysia', 'poland', 'netherlands', 'china', 'japan', 'india', 'korea', 'philippines', 'phillipines', 'philippine', 'cambodia', 'hong kong', 'hongkong', 'taiwan', 'bangladesh', 'usa', 'singapore', 'switzerland', 'germany', 'mongolia', 'new zealand', 'latvia', 'lithuania', 'france', 'romania', 'united arab emirates', 'uae', 'timor-leste', 'timor leste', 'uk', 'canada', 'macau', 'indonesia', 'seoul']);
function normSeg(seg: string): string {
  let s = seg.trim().toLowerCase();
  s = s.replace(/\([^)]*\)/g, '').trim();
  s = s.replace(/^(the|rep\.?\s+of|republic\s+of|p\.?\s*r\.?\s*o?f?\.?|p\.?\s*r\.?)\s+/, '').trim();
  s = s.replace(/[.\s]+$/, '').trim();
  return s;
}
function stripCountrySuffix(name: string, extra?: string): string {
  const extras = new Set((extra ? [extra] : []).map(normSeg).filter(Boolean));
  const i = name.lastIndexOf(',');
  if (i < 0) return name;
  const n = normSeg(name.slice(i + 1));
  if (n && (COUNTRY_ALIASES.has(n) || extras.has(n))) return name.slice(0, i).replace(/[\s,]+$/, '').trim();
  return name;
}

// ---- aggregate institutions from the CSV -----------------------------------
interface Faculty { faculty: string; programs: string[] }
interface Agg {
  name: string; country: string | null;
  faculties: Map<string, string[]>; // faculty -> ordered unique programs
  openEnded: boolean; maxDate: Date | null;
}

function buildAggregates(): Agg[] {
  const rows = parseCSV(readFileSync(resolve(process.cwd(), 'assets/Data/International Partners.csv'), 'utf8'));
  const [h1, h2, h3] = rows;

  // Faculty/study-program columns are 20..55. Faculty name forward-fills from
  // row1; the program label is row3 when present, else row2 (renamed programs).
  const PROG_START = 20, PROG_END = 55;
  const colFaculty: string[] = []; const colProgram: string[] = [];
  let curFac = '';
  for (let i = 0; i <= PROG_END; i++) {
    if ((h1[i] || '').trim()) curFac = (h1[i] || '').trim();
    colFaculty[i] = curFac;
    colProgram[i] = ((h3[i] || '').trim() || (h2[i] || '').trim());
  }

  const I = { inst: 1, neg: 2, mou: 5, moa: 6, ber: 13, ar: 14 };
  const data = rows.filter((r) => /^\d+$/.test((r[0] || '').trim()));

  const groups = new Map<string, Agg>();
  for (const r of data) {
    const rawName = norm(r[I.inst]); if (!rawName) continue;
    if (!isTrue(r[I.mou]) && !isTrue(r[I.moa])) continue; // IA-only / no document

    const ber = (r[I.ber] || '').trim(); const ar = (r[I.ar] || '').trim();
    const blob = `${ber} ${ar}`.toLowerCase();
    let active: boolean; let open = false; let dated: Date | null = null;
    if (/no limit|years to come/.test(blob)) { active = true; open = true; }
    else if (/auto renew/.test(ber)) { const ad = parseDate(ar); active = ad ? ad >= TODAY : true; open = true; dated = ad; }
    else { dated = [parseDate(ber), parseDate(ar)].filter(Boolean).sort((a, b) => +b! - +a!)[0] ?? null; active = dated ? dated >= TODAY : true; }
    if (!active) continue;

    const country = norm(r[I.neg]) || null;
    const name = stripCountrySuffix(rawName, country ?? undefined);
    const keyk = name.toLowerCase();
    let g = groups.get(keyk);
    if (!g) { g = { name, country, faculties: new Map(), openEnded: false, maxDate: null }; groups.set(keyk, g); }

    if (open) g.openEnded = true;
    if (dated && (!g.maxDate || dated > g.maxDate)) g.maxDate = dated;

    for (let i = PROG_START; i <= PROG_END; i++) {
      if (!isTrue(r[i])) continue;
      const fac = colFaculty[i]; const prog = colProgram[i];
      if (!fac || !prog) continue;
      const list = g.faculties.get(fac) ?? [];
      if (!list.includes(prog)) list.push(prog);
      g.faculties.set(fac, list);
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function expiryOf(g: Agg): string {
  if (g.openEnded || !g.maxDate) return 'No fixed end date';
  return String(g.maxDate.getUTCFullYear());
}

// ---- block builders --------------------------------------------------------
const mk = (type: string, position: number, config: Record<string, unknown>, content: Record<string, unknown>) => ({ type, position, config, content });

async function main() {
  const supabase = createClient(url!, key!, { db: { schema: 'petra_io' } });

  const aggs = buildAggregates();
  const countryCount = new Set(aggs.map((a) => a.country).filter(Boolean)).size;

  // Marquee tiles: only partners that have a matched logo (the list is logos).
  const marqueePartners = aggs
    .map((g) => {
      const logoUrl = partnerLogo(g.name);
      if (!logoUrl) return null;
      const faculties: Faculty[] = [...g.faculties.entries()].map(([faculty, programs]) => ({ faculty, programs }));
      return { name: g.name, country: g.country, logoUrl, expiry: expiryOf(g), faculties };
    })
    .filter(Boolean);

  console.log(`Aggregated ${aggs.length} active institutions; ${marqueePartners.length} have logos for the marquee.`);

  // Does the partners table hold any domestic rows worth mapping?
  const { count: domesticCount } = await supabase
    .from('partners').select('*', { count: 'exact', head: true })
    .eq('kind', 'domestic').not('lat', 'is', null);

  const blocks = [
    mk('hero', 0, { background: 'navy', spacing: 'spacious', layout: 'centered' }, {
      eyebrow: { en: 'Petra Christian University · International Office', id: 'Universitas Kristen Petra · International Office' },
      heading: { en: 'Partnership', id: 'Kemitraan' },
      subcopy: {
        en: 'Petra Christian University collaborates with universities, institutions, and industry partners across the globe through Memoranda of Understanding and Agreement.',
        id: 'Universitas Kristen Petra menjalin kerja sama dengan universitas, institusi, dan mitra industri di seluruh dunia melalui Nota Kesepahaman dan Kesepakatan.',
      },
    }),
    mk('stat_strip', 1, { background: 'navy', spacing: 'normal' }, {
      stats: [
        { auto: 'partners_international', label: { en: 'Global partners', id: 'Mitra global' } },
        { value: String(countryCount), label: { en: 'Countries', id: 'Negara' } },
        { value: String(marqueePartners.length), label: { en: 'Partner logos', id: 'Logo mitra' } },
      ],
    }),
    mk('partner_map', 2, { background: 'navy', spacing: 'normal', filterKind: 'international', defaultZoom: 1 }, {
      heading: { en: 'Our global network', id: 'Jaringan global kami' },
    }),
    mk('logo_wall', 3, { background: 'navy', spacing: 'normal', layout: 'marquee' }, {
      heading: { en: 'Our partner institutions', id: 'Institusi mitra kami' },
      partners: marqueePartners,
    }),
  ];

  if ((domesticCount ?? 0) > 0) {
    blocks.push(mk('partner_map', 4, { background: 'paper', spacing: 'normal', filterKind: 'domestic', defaultZoom: 3 }, {
      heading: { en: 'Our partners across Indonesia', id: 'Mitra kami di seluruh Indonesia' },
    }));
  }

  // ---- upsert the page, then replace its blocks ----------------------------
  const { data: existing } = await supabase.from('pages').select('id').eq('slug', 'partnership').maybeSingle();
  const pageFields = {
    slug: 'partnership',
    title: { en: 'Partnership', id: 'Kemitraan' },
    nav_section: 'partnership',
    nav_order: 30,
    status: 'published',
    seo: {
      title: { en: 'Partnership', id: 'Kemitraan' },
      description: {
        en: 'Petra Christian University’s global partner network — universities and institutions across the world.',
        id: 'Jaringan mitra global Universitas Kristen Petra — universitas dan institusi di seluruh dunia.',
      },
    },
  };

  let pageId: string;
  if (existing?.id) {
    pageId = existing.id;
    const { error } = await supabase.from('pages').update(pageFields).eq('id', pageId);
    if (error) { console.error('Update page failed:', error.message); process.exit(1); }
    const { error: delErr } = await supabase.from('blocks').delete().eq('page_id', pageId);
    if (delErr) { console.error('Delete old blocks failed:', delErr.message); process.exit(1); }
    console.log('Updated existing partnership page; cleared its blocks.');
  } else {
    const { data: ins, error } = await supabase.from('pages').insert(pageFields).select('id').single();
    if (error || !ins) { console.error('Insert page failed:', error?.message); process.exit(1); }
    pageId = ins.id;
    console.log('Created partnership page.');
  }

  const { error: blkErr } = await supabase.from('blocks').insert(blocks.map((b) => ({ ...b, page_id: pageId })));
  if (blkErr) { console.error('Insert blocks failed:', blkErr.message); process.exit(1); }

  console.log(`Done. Partnership page has ${blocks.length} blocks (domestic map: ${(domesticCount ?? 0) > 0 ? 'yes' : 'no'}).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
