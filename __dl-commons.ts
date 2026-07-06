import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const LOGO = resolve(ROOT, 'assets/Logo');
const UA = 'PetraGlobalWebsite-LogoFetcher/1.0 (https://petra.ac.id; contact zefanya.kharisma@gmail.com)';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// query = Commons search terms; must[] = words the filename must contain (any);
type Item = { q: string; must: string[]; country: string; db: string };

const ITEMS: Item[] = [
  { q: 'Filamer Christian University logo', must: ['filamer'], country: 'Philippines', db: 'Filamer Christian University' },
  { q: 'Hanze University Applied Sciences logo', must: ['hanze'], country: 'Netherlands', db: 'Hanze University of Applied Science / Hanzehogeschool Groningen' },
  { q: 'Tianjin University logo', must: ['tianjin'], country: 'China', db: 'Tianjin University, Tianjin' },
  { q: 'Diponegoro University logo', must: ['diponegoro'], country: 'Indonesia', db: 'Universitas Diponegoro' },
  { q: 'Maranatha Christian University Bandung logo', must: ['maranatha'], country: 'Indonesia', db: 'Universitas Kristen Maranatha' },
  { q: 'Poznan University Life Sciences logo', must: ['poznan', 'life', 'przyrodni'], country: 'Poland', db: 'Poznań University of Life Science' },
  { q: 'MIT Art Design Technology University logo', must: ['mit'], country: 'India', db: 'Mit Art, Design, and Technology University (MIT ADTU)' },
  { q: 'Joongbu University logo', must: ['joongbu'], country: 'South Korea', db: 'Joongbu University' },
  { q: 'Swan Maclaren logo', must: ['swan'], country: 'Singapore', db: 'Swan & Maclaren Architects' },
  { q: 'CLO Virtual Fashion logo', must: ['clo'], country: 'Hong Kong', db: 'CLO Virtual Fashion LLC' },
];

function safeName(db: string): string {
  return db.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
}

async function search(q: string): Promise<{ title: string; url: string }[]> {
  const qs = new URLSearchParams({
    format: 'json', action: 'query', generator: 'search', gsrsearch: q,
    gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600',
  }).toString();
  const r = await fetch(`${COMMONS}?${qs}`, { headers: { 'User-Agent': UA } });
  const j: any = await r.json();
  const pages = j?.query?.pages ?? {};
  const out: { title: string; url: string }[] = [];
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    const ii = p?.imageinfo?.[0];
    if (ii?.thumburl || ii?.url) out.push({ title: p.title, url: ii.thumburl || ii.url });
  }
  return out;
}

async function main() {
  const ok: string[] = [];
  const fail: string[] = [];
  for (const it of ITEMS) {
    try {
      const results = await search(it.q);
      await sleep(900);
      // rank: must-match filename, prefer logo-ish, avoid photos/buildings/people
      const scored = results
        .map((r) => ({ ...r, low: r.title.toLowerCase() }))
        .filter((r) => /\.(svg|png|jpe?g)$/i.test(r.title) && it.must.some((m) => r.low.includes(m)))
        .filter((r) => !/building|campus|gate|photo|aerial|entrance|prof|portrait|panorama|map|banner|students?/i.test(r.low))
        .sort((a, b) => (Number(/logo|seal|emblem|crest|wordmark|logotype/i.test(b.low)) - Number(/logo|seal|emblem|crest|wordmark|logotype/i.test(a.low))));
      const chosen = scored[0];
      if (!chosen) { fail.push(`${it.db}  (no commons match for "${it.q}"; candidates: ${results.slice(0,3).map(r=>r.title).join(' | ')})`); continue; }
      const ext = /\.png/i.test(chosen.url) ? '.png' : /\.jpe?g/i.test(chosen.url) ? '.jpg' : '.png';
      const buf = Buffer.from(await (await fetch(chosen.url, { headers: { 'User-Agent': UA } })).arrayBuffer());
      if (buf.slice(0, 15).toString('utf8').includes('<!DOCTYPE') || buf.slice(0,6).toString('utf8').includes('<html')) {
        fail.push(`${it.db}  (got HTML from ${chosen.url})`); await sleep(600); continue;
      }
      mkdirSync(join(LOGO, it.country), { recursive: true });
      const fname = safeName(it.db) + ext;
      writeFileSync(join(LOGO, it.country, fname), buf);
      ok.push(`${it.country}/${fname}  (${(buf.length / 1024).toFixed(0)}kb)  <- ${chosen.title}`);
      await sleep(600);
    } catch (e: any) {
      fail.push(`${it.db}  (error: ${e.message})`);
      await sleep(600);
    }
  }
  console.log('=== DOWNLOADED ===');
  ok.forEach((s) => console.log(s));
  console.log(`\n=== FAILED (${fail.length}) ===`);
  fail.forEach((s) => console.log(s));
}
main();
