import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const LOGO = resolve(ROOT, 'assets/Logo');
const UA = 'PetraGlobalWebsite-LogoFetcher/1.0 (https://petra.ac.id; contact zefanya.kharisma@gmail.com)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// try these (wiki, title) candidates in order until an infobox logo is found
type Item = { country: string; db: string; cand: [string, string][] };

const ITEMS: Item[] = [
  { country: 'China', db: 'Tianjin University, Tianjin', cand: [['en', 'Tianjin University'], ['zh', '天津大学']] },
  { country: 'Indonesia', db: 'Universitas Diponegoro', cand: [['id', 'Universitas Diponegoro'], ['en', 'Diponegoro University']] },
  { country: 'Indonesia', db: 'Universitas Kristen Maranatha', cand: [['id', 'Universitas Kristen Maranatha'], ['en', 'Maranatha Christian University']] },
  { country: 'Poland', db: 'Poznań University of Life Science', cand: [['pl', 'Uniwersytet Przyrodniczy w Poznaniu'], ['en', 'Poznań University of Life Sciences']] },
  { country: 'India', db: 'Mit Art, Design, and Technology University (MIT ADTU)', cand: [['en', 'MIT Art, Design and Technology University'], ['en', 'MIT Art Design and Technology University']] },
  { country: 'South Korea', db: 'Joongbu University', cand: [['ko', '중부대학교'], ['en', 'Joongbu University']] },
];

function safeName(db: string): string {
  return db.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
}

async function wikitext(wiki: string, title: string): Promise<string | null> {
  const qs = new URLSearchParams({ format: 'json', action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: title, redirects: '1' }).toString();
  const r = await fetch(`https://${wiki}.wikipedia.org/w/api.php?${qs}`, { headers: { 'User-Agent': UA } });
  const j: any = await r.json();
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    if (k === '-1') return null;
    const c = pages[k]?.revisions?.[0]?.slots?.main?.['*'];
    if (c) return c;
  }
  return null;
}

function extractLogo(wt: string): string | null {
  const m = wt.match(/\|\s*(?:logo|image_name|image|seal_image|crest)\s*=\s*(?:\[\[\s*)?(?:File:|Image:|Berkas:|Plik:|파일:|文件:)?\s*([^\|\n\]\}]+?\.(?:svg|png|jpe?g|gif))/i);
  return m ? m[1].trim() : null;
}

async function fileUrl(wiki: string, file: string): Promise<string | null> {
  const qs = new URLSearchParams({ format: 'json', action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' }).toString();
  const r = await fetch(`https://${wiki}.wikipedia.org/w/api.php?${qs}`, { headers: { 'User-Agent': UA } });
  const j: any = await r.json();
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    const ii = pages[k]?.imageinfo?.[0];
    if (ii?.thumburl) return ii.thumburl;
    if (ii?.url) return ii.url;
  }
  return null;
}

async function main() {
  const ok: string[] = [];
  const fail: string[] = [];
  for (const it of ITEMS) {
    let done = false;
    for (const [wiki, title] of it.cand) {
      try {
        const wt = await wikitext(wiki, title); await sleep(700);
        if (!wt) continue;
        const file = extractLogo(wt);
        if (!file) continue;
        const url = await fileUrl(wiki, file); await sleep(700);
        if (!url) continue;
        const ext = /\.png/i.test(url) ? '.png' : /\.jpe?g/i.test(url) ? '.jpg' : '.png';
        const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
        if (buf.slice(0, 20).toString('utf8').match(/<!DOCTYPE|<html/i)) continue;
        mkdirSync(join(LOGO, it.country), { recursive: true });
        const fname = safeName(it.db) + ext;
        writeFileSync(join(LOGO, it.country, fname), buf);
        ok.push(`${it.country}/${fname}  (${(buf.length / 1024).toFixed(0)}kb)  <- ${wiki}:${file}`);
        done = true; break;
      } catch (e: any) { /* try next candidate */ await sleep(500); }
    }
    if (!done) fail.push(it.db);
  }
  console.log('=== DOWNLOADED ===');
  ok.forEach((s) => console.log(s));
  console.log(`\n=== FAILED (${fail.length}) ===`);
  fail.forEach((s) => console.log(s));
}
main();
