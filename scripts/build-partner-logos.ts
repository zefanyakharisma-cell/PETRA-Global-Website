/**
 * Copy partner logos from assets/Logo/<Country>/<Institution>.<ext> into the
 * web-servable public/partners/ folder and emit a manifest that maps a
 * normalised institution name -> public URL. The partnership page consumes the
 * manifest to show each partner's logo.
 *
 * Re-runnable. Run with:  npx tsx scripts/build-partner-logos.ts
 */
import { readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import { normalizePartnerName } from '../src/lib/partnerLogoMatch';

const ROOT = process.cwd();
const SRC = resolve(ROOT, 'assets/Logo');
const OUT_DIR = resolve(ROOT, 'public/partners');
const MANIFEST = resolve(ROOT, 'src/lib/partnerLogos.generated.json');

// next/image serves these from public/ without extra config; skip SVG (each
// SVG here has a raster twin and SVG needs dangerouslyAllowSVG to render).
const EXTS = new Set(['.png', '.jpg', '.jpeg']);

type Entry = { key: string; url: string; label: string; country: string };

function slugify(s: string): string {
  return s.toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function walk(dir: string, country: string, out: { file: string; country: string }[]) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('._') || name === '.DS_Store' || name === 'desktop.ini') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, name, out);
    else if (EXTS.has(extname(name).toLowerCase())) out.push({ file: full, country });
  }
}

function main() {
  const files: { file: string; country: string }[] = [];
  walk(SRC, '', files);

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const entries: Entry[] = [];
  const seenKeys = new Set<string>();
  const usedSlugs = new Set<string>();
  let copied = 0;

  for (const { file, country } of files) {
    const ext = extname(file).toLowerCase();
    const label = basename(file, extname(file));
    const key = normalizePartnerName(label);
    if (!key || seenKeys.has(key)) continue; // first logo wins per institution
    seenKeys.add(key);

    let slug = slugify(`${country}-${label}`) || slugify(label) || key.replace(/\s+/g, '-');
    let unique = slug;
    let n = 2;
    while (usedSlugs.has(unique)) unique = `${slug}-${n++}`;
    usedSlugs.add(unique);

    const fileName = `${unique}${ext}`;
    copyFileSync(file, join(OUT_DIR, fileName));
    copied++;
    entries.push({ key, url: `/partners/${fileName}`, label, country });
  }

  entries.sort((a, b) => a.label.localeCompare(b.label));
  writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n');
  console.log(`Copied ${copied} logos to public/partners and wrote ${entries.length} manifest entries.`);
}

main();
