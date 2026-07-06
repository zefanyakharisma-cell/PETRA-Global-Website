import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const LOGO = resolve(ROOT, 'assets/Logo');
const UA = 'PetraGlobalWebsite-LogoFetcher/1.0 (https://petra.ac.id; contact zefanya.kharisma@gmail.com)';
const WD = 'https://www.wikidata.org/w/api.php';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// search term -> country folder + db filename
type Item = { search: string; country: string; db: string };
const ITEMS: Item[] = [
  { search: 'Poznań University of Life Sciences', country: 'Poland', db: 'Poznań University of Life Science' },
  { search: 'MIT Art Design and Technology University', country: 'India', db: 'Mit Art, Design, and Technology University (MIT ADTU)' },
  { search: 'Joongbu University', country: 'South Korea', db: 'Joongbu University' },
  { search: 'CLO Virtual Fashion', country: 'Hong Kong', db: 'CLO Virtual Fashion LLC' },
  { search: 'Swan & Maclaren', country: 'Singapore', db: 'Swan & Maclaren Architects' },
  { search: 'Guandata', country: 'China', db: 'GUANDATA' },
  { search: 'Association of Christian Universities and Colleges in Asia', country: 'South Korea', db: 'Association of Christian Universities and Colleges in Asia (ACUCA)' },
  { search: 'Asian Institute of Technology ACECOMS', country: 'Thailand', db: 'ACECOMS Satellite Center' },
  { search: 'Swinburne Centre for Innovation and Enterprise', country: 'Australia', db: 'Centre for Innovation and Enterprise Pty Ltd (CIE)' },
  { search: 'College of Global Hakka Studies', country: 'Taiwan', db: 'College of Global Hakka Studies' },
  { search: 'Academy of Finance and Management Australia', country: 'Australia', db: 'Academy of Finance & Management Australia (AFMA)' },
  { search: 'Speedwing Training Asia', country: 'Singapore', db: 'Speedwing Training (Asia) Pte Ltd' },
  { search: 'Xtramile Solutions', country: 'Australia', db: 'Xtramile Solutions PTY LTD' },
  { search: 'MNA Consultants Singapore', country: 'Singapore', db: 'MNA Consultants PTE, Ltd.' },
  { search: 'Crea Viae Education', country: 'Malaysia', db: 'Crea Viae Education' },
  { search: 'Everbest Global Investment', country: 'Australia', db: 'Everbest G & I Pty. Ltd.' },
  { search: 'Francedia Synvest International', country: 'Australia', db: 'Francedia Synvest International Limited' },
  { search: 'Korea Association of Network Industries', country: 'South Korea', db: 'Korea Association of Network Industries (KANI)' },
  { search: 'World DAGACHI', country: 'South Korea', db: 'World DAGACHI Co.,Ltd' },
  { search: 'Spaceblossom Yuying Design', country: 'Taiwan', db: 'Spaceblossom Yuying Design' },
  { search: 'Amsterdam Faculty of Education Educatieve Faculteit Amsterdam', country: 'Netherlands', db: 'Amsterdam Faculty of Education / EFA (Educatieve Faculteit Amsterdam)' },
  { search: 'Society of Friends of Petra', country: 'Netherlands', db: 'Society of Friends of Petra' },
];

function safeName(db: string): string {
  return db.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
}

// commons file -> direct thumbnail URL (600px), md5 path scheme
function commonsThumb(file: string, w = 600): string {
  const f = file.replace(/ /g, '_');
  const md5 = createHash('md5').update(f).digest('hex');
  const enc = encodeURIComponent(f);
  const isSvg = /\.svg$/i.test(f);
  const base = `https://upload.wikimedia.org/wikipedia/commons`;
  if (isSvg) return `${base}/thumb/${md5[0]}/${md5.slice(0,2)}/${enc}/${w}px-${enc}.png`;
  return `${base}/thumb/${md5[0]}/${md5.slice(0,2)}/${enc}/${w}px-${enc}`;
}

async function findEntity(search: string): Promise<string[]> {
  const qs = new URLSearchParams({ format: 'json', action: 'wbsearchentities', search, language: 'en', uselang: 'en', type: 'item', limit: '5' }).toString();
  const r = await fetch(`${WD}?${qs}`, { headers: { 'User-Agent': UA } });
  const j: any = await r.json();
  return (j?.search ?? []).map((s: any) => s.id);
}

async function logoFile(qid: string): Promise<string | null> {
  const qs = new URLSearchParams({ format: 'json', action: 'wbgetclaims', entity: qid, property: 'P154' }).toString();
  const r = await fetch(`${WD}?${qs}`, { headers: { 'User-Agent': UA } });
  const j: any = await r.json();
  const claims = j?.claims?.P154;
  const val = claims?.[0]?.mainsnak?.datavalue?.value;
  return typeof val === 'string' ? val : null;
}

async function main() {
  const ok: string[] = [];
  const none: string[] = [];
  const fail: string[] = [];
  for (const it of ITEMS) {
    try {
      const ids = await findEntity(it.search); await sleep(400);
      let file: string | null = null;
      for (const id of ids) { file = await logoFile(id); await sleep(300); if (file) break; }
      if (!file) { none.push(`${it.db}`); continue; }
      // try png thumb first, then original
      let src = commonsThumb(file);
      let buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
      if (buf.length < 300 || buf.slice(0, 20).toString('utf8').match(/<!DOCTYPE|<html|Error/i)) {
        fail.push(`${it.db}  (thumb failed for ${file})`); await sleep(300); continue;
      }
      const ext = /\.png$/i.test(file) || /\.svg$/i.test(file) ? '.png' : /\.jpe?g$/i.test(file) ? '.jpg' : '.png';
      mkdirSync(join(LOGO, it.country), { recursive: true });
      const fname = safeName(it.db) + ext;
      writeFileSync(join(LOGO, it.country, fname), buf);
      ok.push(`${it.country}/${fname}  (${(buf.length / 1024).toFixed(0)}kb)  <- ${file}`);
      await sleep(300);
    } catch (e: any) { fail.push(`${it.db}  (error: ${e.message})`); await sleep(300); }
  }
  console.log('=== DOWNLOADED (Wikidata P154) ===');
  ok.forEach((s) => console.log(s));
  console.log(`\n=== NO LOGO ON WIKIDATA (${none.length}) ===`);
  none.forEach((s) => console.log(s));
  console.log(`\n=== FETCH FAILED (${fail.length}) ===`);
  fail.forEach((s) => console.log(s));
}
main();
