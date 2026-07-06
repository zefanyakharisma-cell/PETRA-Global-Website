import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const LOGO = resolve(ROOT, 'assets/Logo');
const UA = 'PetraGlobalWebsite-LogoFetcher/1.0 (https://petra.ac.id; contact zefanya.kharisma@gmail.com)';
const API = 'https://en.wikipedia.org/w/api.php';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Item = { title: string; country: string; db: string };

// only the ones still needing a logo (campus-photo re-dos + not-yet-done)
const ITEMS: Item[] = [
  { title: 'Chinese Culture University', country: 'Taiwan', db: 'Chinese Culture University (CCU)' },
  { title: 'HU University of Applied Sciences Utrecht', country: 'Netherlands', db: 'Hogeschool van Utrecht / Hogeschool Utrecht' },
  { title: 'Asian Institute of Technology', country: 'Thailand', db: 'Asian Institute of Technology' },
  { title: 'Joongbu University', country: 'South Korea', db: 'Joongbu University' },
  { title: 'MIT Art Design and Technology University', country: 'India', db: 'Mit Art, Design, and Technology University (MIT ADTU)' },
  { title: 'Poznań University of Life Sciences', country: 'Poland', db: 'Poznań University of Life Science' },
  { title: 'Rajamangala University of Technology Srivijaya', country: 'Thailand', db: 'Rajamangala University of Technology Srivijaya' },
  { title: 'Singapore Management University', country: 'Singapore', db: 'Singapore Management University (SMU)' },
  { title: 'Swinburne University of Technology', country: 'Australia', db: 'Swinburne University of Technology' },
  { title: 'Ilmenau University of Technology', country: 'Germany', db: 'Technische Universitat Ilmenau' },
  { title: 'Tianjin University', country: 'China', db: 'Tianjin University, Tianjin' },
  { title: 'Diponegoro University', country: 'Indonesia', db: 'Universitas Diponegoro' },
  { title: 'Soegijapranata Catholic University', country: 'Indonesia', db: 'Universitas Katolik Soegijapranata' },
  { title: 'Maranatha Christian University', country: 'Indonesia', db: 'Universitas Kristen Maranatha' },
  { title: 'Tarumanagara University', country: 'Indonesia', db: 'Universitas Tarumanegara' },
  { title: 'Xiamen University', country: 'China', db: 'Xiamen University' },
  { title: 'MikroTik', country: 'Latvia', db: 'MikroTIK, Mikrotikls SIA' },
  { title: 'Swan & Maclaren', country: 'Singapore', db: 'Swan & Maclaren Architects' },
  { title: 'Sika AG', country: 'Indonesia', db: 'PT SIKA Indonesia' },
  { title: 'CLO Virtual Fashion', country: 'Hong Kong', db: 'CLO Virtual Fashion LLC' },
];

function safeName(db: string): string {
  return db.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
}

async function api(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: 'json', ...params }).toString();
  const r = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } });
  const t = await r.text();
  try { return JSON.parse(t); } catch { throw new Error(`non-JSON: ${t.slice(0, 60)}`); }
}

const LOGO_RE = /logo|seal|crest|emblem|wordmark|arms|logotype/i;
const BAD_RE = /building|campus|hall|gate|photo|aerial|entrance|library|tower|map/i;

// pick the best logo file among a page's images
async function pickLogo(title: string): Promise<string | null> {
  const j = await api({ action: 'query', titles: title, prop: 'images', imlimit: '500', redirects: '1' });
  const pages = j?.query?.pages ?? {};
  let files: string[] = [];
  for (const k of Object.keys(pages)) for (const im of pages[k]?.images ?? []) files.push(im.title);
  files = files.filter((f) => /\.(svg|png|jpe?g)$/i.test(f) && !/commons-logo|wikimedia|wikidata|edit-icon|OOjs|ambox|question_book|red_pointer|Location_map|flag_of/i.test(f));
  const logos = files.filter((f) => LOGO_RE.test(f) && !BAD_RE.test(f));
  const chosen = logos[0] ?? null;
  return chosen;
}

async function fileThumb(fileTitle: string): Promise<string | null> {
  const j = await api({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' });
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    const ii = pages[k]?.imageinfo?.[0];
    if (ii?.thumburl) return ii.thumburl;
    if (ii?.url) return ii.url;
  }
  return null;
}

async function pageImageThumb(title: string): Promise<string | null> {
  const j = await api({ action: 'query', titles: title, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '600', redirects: '1' });
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) { const s = pages[k]?.thumbnail?.source; if (s) return s; }
  return null;
}

async function main() {
  const ok: string[] = [];
  const review: string[] = [];
  const fail: string[] = [];
  for (const it of ITEMS) {
    try {
      let src: string | null = null;
      let how = 'logo-file';
      const logoFile = await pickLogo(it.title);
      await sleep(900);
      if (logoFile) { src = await fileThumb(logoFile); await sleep(900); }
      if (!src) { src = await pageImageThumb(it.title); how = 'pageimage(REVIEW)'; await sleep(900); }
      if (!src) { fail.push(`${it.db}  (no image on "${it.title}")`); continue; }
      const ext = /\.png$/i.test(src) ? '.png' : /\.jpe?g$/i.test(src) ? '.jpg' : '.png';
      const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
      mkdirSync(join(LOGO, it.country), { recursive: true });
      const fname = safeName(it.db) + ext;
      writeFileSync(join(LOGO, it.country, fname), buf);
      const line = `${it.country}/${fname}  (${(buf.length / 1024).toFixed(0)}kb)  <- ${decodeURIComponent(src.split('/').pop() || '')}`;
      (how.includes('REVIEW') ? review : ok).push(line);
    } catch (e: any) {
      fail.push(`${it.db}  (error: ${e.message})`);
      await sleep(900);
    }
  }
  console.log('=== DOWNLOADED (logo file) ===');
  ok.forEach((s) => console.log(s));
  console.log(`\n=== DOWNLOADED via pageimage — VERIFY not a photo (${review.length}) ===`);
  review.forEach((s) => console.log(s));
  console.log(`\n=== FAILED (${fail.length}) ===`);
  fail.forEach((s) => console.log(s));
}
main();
