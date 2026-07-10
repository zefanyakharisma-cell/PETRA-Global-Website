/**
 * Seed marquee logos for well-known DOMESTIC partners.
 *
 * The Partner Marquee block (filterKind='domestic') now shows ONLY domestic
 * partners that have a logo_url (see PartnerMarqueeBlock.tsx). This script gives
 * 50 recognizable companies a logo so the domestic marquee reads as a clean wall
 * of familiar brands (banks, McDonald's, GoTo, Pertamina, …) instead of text
 * tiles.
 *
 * For each company it:
 *   1. fetches a rasterized PNG of the brand's logo from Wikimedia Commons
 *      (SVG sources are server-side rendered to PNG — next/image has SVG off);
 *   2. uploads it to the public `petra-io-media` bucket at
 *      partners/domestic/<slug>.png;
 *   3. writes that public URL to the row's logo_url.
 *
 * Two groups (see LOGOS below):
 *   • existing:true  → UPDATE an existing petra_io.domestic_partners row (a real
 *                      partner already seeded from the CSV). `name` must match
 *                      exactly; the script warns if no row is hit.
 *   • existing:false → INSERT a marquee-only brand row (famous Indonesian company
 *                      that is NOT a formal partner — purely decorative for the
 *                      marquee). Idempotent by name. Delete these later if you
 *                      only want real partners in the marquee.
 *
 * Idempotent & re-runnable: images upsert; existing rows update in place;
 * marquee-only rows upsert by name. Requires SUPABASE_SERVICE_ROLE_KEY (bypasses
 * RLS), read from .env.local. Logos are © their owners, sourced from Wikimedia
 * Commons; used here as brand identifiers.
 *
 *   npm run db:seed:domestic-logos
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

const supabase = createClient(url, key, { db: { schema: 'petra_io' } });
const BUCKET = 'petra-io-media';
const UA = 'petra-global-seed/1.0 (+https://petra.ac.id; contact: zefanya.kharisma@gmail.com)';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

interface Logo {
  name: string;        // exact petra_io.domestic_partners.name (existing) or new row name
  slug: string;        // storage filename + stable key
  commons: string;     // Wikimedia Commons file title (without the "File:" prefix)
  existing: boolean;   // true = update a real partner row; false = insert marquee-only brand
  city?: string;       // only used when inserting a marquee-only row
}

// ── 37 real domestic partners (already seeded from the CSV) — logo added ────────
// ── 13 marquee-only famous brands (existing:false) — inserted for decoration ───
const LOGOS: Logo[] = [
  // Banks & finance
  { name: 'PT Bank Central Asia Tbk (BCA)', slug: 'bca', commons: 'Bank Central Asia.svg', existing: true },
  { name: 'PT Bank Mandiri (Persero) Tbk', slug: 'bank-mandiri', commons: 'Bank Mandiri logo 2016.svg', existing: true },
  { name: 'PT Bank Negara Indonesia (Persero) Tbk, Jakarta Pusat', slug: 'bni', commons: 'Bank Negara Indonesia logo (2004).svg', existing: true },
  { name: 'PT Bank Pembangunan Daerah Jawa Timur Tbk (Bank Jatim)', slug: 'bank-jatim', commons: 'Bank-Jatim-Logo.svg', existing: true },
  { name: 'PT Bank Mayapada Internasional Tbk (Bank Mayapada)', slug: 'bank-mayapada', commons: 'Bank Mayapada.png', existing: true },
  { name: 'PT Bursa Efek Indonesia (BEI)', slug: 'idx', commons: 'Logo-idx.png', existing: true },
  { name: 'PT Sinarmas Sekuritas', slug: 'sinarmas-sekuritas', commons: 'Logo Sinarmas Sekuritas.png', existing: true },
  { name: 'PT Astra Sedaya Finance', slug: 'astra', commons: 'ASTRA international.svg', existing: true },
  // Energy, industrial & manufacturing
  { name: 'PT Pertamina (Persero)', slug: 'pertamina', commons: 'Pertamina Logo.svg', existing: true },
  { name: 'PT. Semen Indonesia (Persero) Tbk.', slug: 'semen-indonesia', commons: 'Semen Indonesia logo (2013-2019).svg', existing: true },
  { name: 'PT Nipsea Paints and Chemicals (Nippon Paint)', slug: 'nippon-paint', commons: 'Nippon Paint company logo.svg', existing: true },
  { name: 'PT Schneider Indonesia', slug: 'schneider-electric', commons: 'Schneider Electric 2007.svg', existing: true },
  { name: 'PT. Bosch Rexroth', slug: 'bosch', commons: 'Bosch-logo.svg', existing: true },
  { name: 'Maspion Group', slug: 'maspion', commons: 'Maspion Group logo.svg', existing: true },
  { name: 'PT HM Sampoerna', slug: 'sampoerna', commons: 'Logo Sampoerna.png', existing: true },
  { name: 'PT. Charoen Popkphand Indonesia Tbk - Jawa Timur', slug: 'charoen-pokphand', commons: 'CPF Logo.svg', existing: true },
  { name: 'PT. Transforma Oto Prima (Mercedes-Benz)', slug: 'mercedes-benz', commons: 'Mercedes-Benz Logo 2010.svg', existing: true },
  // Consumer, retail & F&B
  { name: "PT Rekso Nasional Food (McDonald's)", slug: 'mcdonalds', commons: "McDonald's Golden Arches.svg", existing: true },
  { name: 'PT Erajaya Swasembada, Tbk', slug: 'erajaya', commons: 'Erajaya.svg', existing: true },
  { name: 'Wings Group Surabaya', slug: 'wings', commons: 'Wings (Indonesian company) logo.svg', existing: true },
  { name: 'PT. Piaget Indonesia', slug: 'piaget', commons: 'Piaget logo.svg', existing: true },
  // Tech & digital
  { name: 'PT GoTo Gojek Tokopedia Tbk', slug: 'goto', commons: 'GoTo logo.svg', existing: true },
  { name: 'PT Tokopedia', slug: 'tokopedia', commons: 'Tokopedia.svg', existing: true },
  { name: 'PT Grab Teknologi Indonesia', slug: 'grab', commons: 'Grab Logo.svg', existing: true },
  { name: 'PT Odoo Software Indonesia', slug: 'odoo', commons: 'Odoo logo rgb.svg', existing: true },
  // Media & publishing
  { name: 'Harian Pagi Kompas', slug: 'kompas', commons: 'Kompas.svg', existing: true },
  { name: 'Gramedia Specialized Publications', slug: 'gramedia', commons: 'Gramedia wordmark.svg', existing: true },
  // Professional bodies & consulting
  { name: 'PT Grant Thornton Indonesia', slug: 'grant-thornton', commons: 'Grant Thornton logo.png', existing: true },
  { name: 'Association of Chartered Cerified Accountants (ACCA) Indonesia', slug: 'acca', commons: 'ACCA logo.svg', existing: true },
  { name: 'The Institute of Chartered Accountants in England and Wales (ICAEW) Indonesia', slug: 'icaew', commons: 'Logo icaew.svg', existing: true },
  // Education & culture
  { name: 'Yayasan Monash University Indonesia (Monash University Indonesia)', slug: 'monash', commons: 'Monash University logo.svg', existing: true },
  { name: 'German Academic Exchange Service (DAAD) Indonesia', slug: 'daad', commons: 'DAAD Logo.svg', existing: true },
  // Hospitality & health
  { name: 'PT. Graha Alam Lestari (The Apurva Kempinski Bali)', slug: 'kempinski', commons: 'Kempinski Logo 2015.svg', existing: true },
  { name: 'Sheraton Surabaya Hotel', slug: 'sheraton', commons: 'Sheraton Hotels and Resorts.svg', existing: true },
  { name: 'Four Points By Sheraton Surabaya', slug: 'four-points', commons: 'Four Points Logo neu.svg', existing: true },
  { name: 'Hotel Double Tree by Hilton Surabaya', slug: 'hilton', commons: 'Hilton Worldwide Logo.png', existing: true },
  { name: 'Mayapada Group', slug: 'mayapada', commons: 'Logo Mayapada Hospital.png', existing: true },

  // ── Marquee-only famous brands (NOT formal partners) ─────────────────────────
  { name: 'PT Bank Rakyat Indonesia (Persero) Tbk (BRI)', slug: 'bri', commons: 'Bank-Rakyat-Indonesia-Logo.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Bank Syariah Indonesia Tbk (BSI)', slug: 'bsi', commons: 'Bank Syariah Indonesia.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Bank CIMB Niaga Tbk', slug: 'cimb-niaga', commons: 'CIMB Niaga logo.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Indofood Sukses Makmur Tbk', slug: 'indofood', commons: 'Indofood logo-en.svg', existing: false, city: 'Jakarta' },
  { name: 'Kopiko (Mayora Indah)', slug: 'kopiko', commons: 'Kopiko.svg', existing: false, city: 'Tangerang' },
  { name: 'PT Sumber Alfaria Trijaya Tbk (Alfamart)', slug: 'alfamart', commons: 'Alfamart logo.svg', existing: false, city: 'Tangerang' },
  { name: 'PT Industri Jamu dan Farmasi Sido Muncul Tbk', slug: 'sido-muncul', commons: 'Logo Official SidoMuncul. Tbk.svg', existing: false, city: 'Semarang' },
  { name: 'PT Telkom Indonesia (Persero) Tbk', slug: 'telkom', commons: 'Telkom Indonesia logo.png', existing: false, city: 'Jakarta' },
  { name: 'PT Indosat Tbk (Indosat Ooredoo Hutchison)', slug: 'indosat', commons: 'Indosat Ooredoo Hutchison.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Astra Honda Motor (AHM)', slug: 'ahm', commons: 'Logo AHM.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Global Digital Niaga Tbk (Blibli)', slug: 'blibli', commons: 'Blibli (2023).svg', existing: false, city: 'Jakarta' },
  { name: 'PT Bukalapak.com Tbk', slug: 'bukalapak', commons: 'Bukalapak logo.svg', existing: false, city: 'Jakarta' },
  { name: 'PT Trinusa Travelindo (Traveloka)', slug: 'traveloka', commons: 'Logo Traveloka.png', existing: false, city: 'Jakarta' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch() with polite retry on 429/5xx (Wikimedia rate-limits bursts). */
async function fetchRetry(u: string, tries = 5): Promise<Response> {
  for (let i = 0; ; i++) {
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (r.ok) return r;
    if ((r.status === 429 || r.status >= 500) && i < tries) {
      const wait = 1500 * (i + 1);
      console.log(`    …${r.status}, retrying in ${wait}ms`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${r.status} for ${u}`);
  }
}

async function j(u: string): Promise<any> {
  return (await fetchRetry(u)).json();
}

/** Resolve a Commons file title to a rasterized PNG URL (512px wide) and download it. */
async function fetchLogoPng(commons: string): Promise<Buffer> {
  const info = await j(
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|mime` +
    `&iiurlwidth=512&titles=${encodeURIComponent('File:' + commons)}`,
  );
  const page: any = Object.values(info?.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) throw new Error(`Commons file not found: ${commons}`);
  const ii = page.imageinfo?.[0];
  // thumburl is the PNG raster of an SVG; for raster sources it's a resized PNG/JPEG.
  const dl = ii?.thumburl ?? ii?.url;
  if (!dl) throw new Error(`No image URL for ${commons}`);
  return Buffer.from(await (await fetchRetry(dl)).arrayBuffer());
}

const publicUrl = (dbKey: string) => supabase.storage.from(BUCKET).getPublicUrl(dbKey).data.publicUrl;

async function main() {
  let ok = 0, warn = 0;
  for (const l of LOGOS) {
    const key = `partners/domestic/${l.slug}.png`;
    try {
      const bytes = await fetchLogoPng(l.commons);
      const up = await supabase.storage.from(BUCKET).upload(key, bytes, { contentType: 'image/png', upsert: true });
      if (up.error) throw new Error(`upload: ${up.error.message}`);
      const logo_url = publicUrl(key);

      if (l.existing) {
        const { data, error } = await supabase
          .from('domestic_partners').update({ logo_url }).eq('name', l.name).select('id');
        if (error) throw new Error(`update: ${error.message}`);
        if (!data || data.length === 0) {
          console.warn(`  ⚠ no domestic_partners row matched "${l.name}" — logo uploaded but not linked.`);
          warn++; continue;
        }
      } else {
        // Marquee-only brand: upsert by unique name (insert once, then just refresh logo).
        const { data: found } = await supabase.from('domestic_partners').select('id').eq('name', l.name).maybeSingle();
        if (found) {
          const { error } = await supabase.from('domestic_partners').update({ logo_url }).eq('id', found.id);
          if (error) throw new Error(`update: ${error.message}`);
        } else {
          const { error } = await supabase.from('domestic_partners').insert({ name: l.name, city: l.city ?? null, logo_url });
          if (error) throw new Error(`insert: ${error.message}`);
        }
      }
      console.log(`  ✓ ${l.existing ? 'linked' : 'brand '} ${l.name}  →  ${key}`);
      ok++;
    } catch (e: any) {
      console.warn(`  ⚠ ${l.name}: ${e.message}`);
      warn++;
    }
    await sleep(350); // be gentle with the Wikimedia servers
  }
  console.log(`\nDone. ${ok} logos set, ${warn} warnings. The domestic marquee now shows the logo'd partners only.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
