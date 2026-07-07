/**
 * Seed the /about/accreditation page with a richer, more immersive set of CMS
 * blocks — and upload the ranking badges & accreditation-body logos it needs.
 *
 * Two jobs, both safe + re-runnable:
 *   1. Upload every image in
 *      `assets/Accreditation/Accreditation & Achievement/` that this page uses
 *      into the public `petra-io-media` bucket under `accreditation/…`
 *      (upsert — re-running just overwrites the same objects).
 *   2. Rewrite the single `about/accreditation` page's blocks: keep the strong
 *      text sections (hero, stats, international-accreditation feature list, the
 *      per-program list, CTA) and interleave three "logo wall" showcases so the
 *      QS/THE ranking badges and the AQAS / AUN-QA / IABEE / KAAB / BAN-PT logos
 *      are shown, not just named.
 *
 *   npm run db:seed:accreditation
 *
 * Touches only this one page's blocks (delete + re-insert) and the
 * `accreditation/…` storage prefix, so re-running yields no duplicates and never
 * affects any other page. Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS),
 * read from .env.local.
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

const SLUG = 'about/accreditation';
const BUCKET = 'petra-io-media';
const ASSET_DIR = resolve(process.cwd(), 'assets/Accreditation/Accreditation & Achievement');

// --- image uploads ----------------------------------------------------------
// sourceFile (in ASSET_DIR)  ->  clean storage key under `accreditation/`.
const UPLOADS: Record<string, string> = {
  // Ranking & achievement badges (portrait / wide — shown contained, uncropped)
  'QS World University Rankings - 2026 - Badge.png': 'accreditation/qs-world-2026.png',
  'QS Asia University Rankings - 2026 - Badge.png': 'accreditation/qs-asia-2026.png',
  'QS Sustainability Rankings - 2026 - Badge.png': 'accreditation/qs-sustainability-2026.png',
  'Ranked-y2025-WUR-SR-Overall-badge.png': 'accreditation/the-sustainability-2025.png',
  'TOP 100 QS South Estern Asia.png': 'accreditation/qs-sea-top100.png',
  'BestUniv-09.png': 'accreditation/best-university-seal.png',
  // International accreditation bodies / accords
  'AQAS-01.png': 'accreditation/aqas.png',
  'aun-qa.png': 'accreditation/aun-qa.png',
  'IABEE Logo_Acc_Program_ENG.png': 'accreditation/iabee.png',
  'Canberra Accord.png': 'accreditation/canberra-accord.png',
  'KAAB full.png': 'accreditation/kaab.png',
  // National accreditation
  'BAN PT Unggul.png': 'accreditation/ban-pt-unggul.png',
  'Logo-Tersier-Diktisaintek-Berdampak-1.png': 'accreditation/diktisaintek.png',
};

const publicUrl = (dbKey: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(dbKey).data.publicUrl;

async function uploadImages() {
  for (const [file, dbKey] of Object.entries(UPLOADS)) {
    const bytes = readFileSync(resolve(ASSET_DIR, file));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dbKey, bytes, { contentType: 'image/png', upsert: true });
    if (error) throw new Error(`Upload failed for ${file}: ${error.message}`);
    console.log(`  ↑ ${file}  →  ${dbKey}`);
  }
}

// short handles for the block URLs
const U = Object.fromEntries(
  Object.values(UPLOADS).map((k) => [k.replace('accreditation/', '').replace('.png', ''), publicUrl(k)]),
) as Record<string, string>;

// --- tiny block builders (mirrors supabase/seed-pages.ts) -------------------
type L = { en: string; id: string };
const t = (en: string, id: string): L => ({ en, id });
type Block = { type: string; config: Record<string, unknown>; content: Record<string, unknown> };
type Logo = { url: string; name?: string };
const B = { accent: 'blue' } as const;

const hero = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'hero', config: { background: 'navy', spacing: 'spacious', layout: 'centered', bgType: 'aurora', accent: 'blue', ...cfg }, content: { ctas: [], ...content },
});
const sectionHeader = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'section_header', config: { background: 'paper', spacing: 'normal', layout: 'center', alignment: 'center', accent: 'blue', ...cfg }, content,
});
const statStrip = (stats: { value: string; label: L }[], cfg: Record<string, unknown> = {}): Block => ({
  type: 'stat_strip', config: { background: 'navy', spacing: 'normal', layout: 'cards', accent: 'blue', ...cfg }, content: { stats: stats.map((s) => ({ auto: 'none', ...s })) },
});
const featureList = (
  content: { heading?: L; intro?: L; items: { icon: string; title: L; body: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({ type: 'feature_list', config: { background: 'paper', spacing: 'normal', layout: 'cards', columns: 2, accent: 'blue', ...cfg }, content });
const logoWall = (
  content: { heading?: L; logos: Logo[] },
  cfg: Record<string, unknown> = {},
): Block => ({ type: 'logo_wall', config: { background: 'paper', spacing: 'normal', layout: 'grid', style: 'color', columns: 4, ...cfg }, content });
const richText = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'rich_text', config: { background: 'paper', spacing: 'normal', width: 'full', ...cfg }, content,
});
const cta = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'cta_banner', config: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'cyan', ...cfg }, content: { ctas: [], ...content },
});

// ---------------------------------------------------------------------------
// The Accreditation & Rankings page — ordered blocks.
// ---------------------------------------------------------------------------
function buildBlocks(): Block[] {
  return [
    hero({
      eyebrow: t('Institutional Excellence', 'Keunggulan Institusional'),
      heading: t('Rankings, Metrics & Global Trust', 'Peringkat, Metrik & Kepercayaan Global'),
      subcopy: t(
        'Over six decades since its founding in 1961, Petra Christian University (UK. Petra) has cultivated a legacy of academic excellence and character-building — evolving into a world-leading Christian university.',
        'Selama lebih dari enam dekade sejak didirikan pada 1961, Universitas Kristen Petra (UK. Petra) telah membangun warisan keunggulan akademik dan pembentukan karakter — berkembang menjadi universitas Kristen kelas dunia.',
      ),
    }),

    sectionHeader({
      eyebrow: t('PETRA by the numbers (2025–2026)', 'PETRA dalam angka (2025–2026)'),
      heading: t('Recognized quality, at home and abroad', 'Kualitas yang diakui, di dalam dan luar negeri'),
      intro: t(
        'A Global Petranesian alumni network of 53,080 is active across 6 continents and 55 countries.',
        'Jaringan alumni Global Petranesian sebanyak 53.080 orang aktif di 6 benua dan 55 negara.',
      ),
    }),

    statStrip([
      { value: '#1', label: t('QS 2026 — Best Private University in East Java', 'QS 2026 — Universitas Swasta Terbaik di Jawa Timur') },
      { value: '#526', label: t('QS Asia University Rankings 2026', 'QS Asia University Rankings 2026') },
      { value: 'Top 100', label: t('QS South-Eastern Asia Ranking 2025', 'Peringkat QS Asia Tenggara 2025') },
      { value: 'Excellent', label: t('Institutional Accreditation (BAN-PT)', 'Akreditasi Institusi (BAN-PT)') },
    ]),

    // NEW — the ranking badges themselves, shown full (contain).
    logoWall({
      heading: t('QS & THE World Rankings — 2025 / 2026', 'Peringkat Dunia QS & THE — 2025 / 2026'),
      logos: [
        { url: U['qs-world-2026'], name: 'QS World University Rankings 2026' },
        { url: U['qs-asia-2026'], name: 'QS Asia University Rankings 2026' },
        { url: U['qs-sustainability-2026'], name: 'QS Sustainability Rankings 2026' },
        { url: U['the-sustainability-2025'], name: 'THE Sustainability Ranking 2025' },
        { url: U['qs-sea-top100'], name: 'Top 100 — QS South-Eastern Asia' },
        { url: U['best-university-seal'], name: 'Best Private University' },
      ],
    }, { columns: 3 }),

    featureList({
      heading: t('International Accreditations & Memberships', 'Akreditasi & Keanggotaan Internasional'),
      intro: t(
        'Study programs at UK. Petra carry recognition from leading global accreditation bodies and accords.',
        'Program studi di UK. Petra memperoleh pengakuan dari lembaga dan kesepakatan akreditasi global terkemuka.',
      ),
      items: [
        { icon: 'award', title: t('AQAS (Germany)', 'AQAS (Jerman)'), body: t('Operating in strict compliance with European Standards (ESG). Accredited: Visual Communication Design (DKV) and Interior Design.', 'Beroperasi sesuai Standar Eropa (ESG). Terakreditasi: Desain Komunikasi Visual (DKV) dan Desain Interior.') },
        { icon: 'globe', title: t('AUN-QA (ASEAN Network)', 'AUN-QA (Jaringan ASEAN)'), body: t('Harmonizing educational standards regionally. Accredited: Architecture, Accounting, Management, and Communication Science.', 'Menyelaraskan standar pendidikan di tingkat regional. Terakreditasi: Arsitektur, Akuntansi, Manajemen, dan Ilmu Komunikasi.') },
        { icon: 'building', title: t('Washington Accord (via IABEE)', 'Washington Accord (melalui IABEE)'), body: t('Verifies substantial equivalency and global acknowledgement for engineering degrees. Certified: Civil, Electrical, Mechanical, Industrial Engineering, and Informatics.', 'Memverifikasi kesetaraan substansial dan pengakuan global untuk gelar teknik. Tersertifikasi: Teknik Sipil, Elektro, Mesin, Industri, dan Informatika.') },
        { icon: 'pin', title: t('Canberra Accord (via KAAB)', 'Canberra Accord (melalui KAAB)'), body: t('Facilitates worldwide architecture qualification equivalence. Certified: Architecture Bachelor’s & Postgraduate Programs.', 'Memfasilitasi kesetaraan kualifikasi arsitektur di seluruh dunia. Tersertifikasi: Program Sarjana & Pascasarjana Arsitektur.') },
      ],
    }),

    // NEW — the international body logos, reinforcing the feature list above.
    logoWall({
      heading: t('Accredited by leading international bodies', 'Terakreditasi oleh lembaga internasional terkemuka'),
      logos: [
        { url: U['aqas'], name: 'AQAS' },
        { url: U['aun-qa'], name: 'AUN-QA' },
        { url: U['iabee'], name: 'IABEE — Washington Accord' },
        { url: U['canberra-accord'], name: 'Canberra Accord' },
        { url: U['kaab'], name: 'KAAB' },
      ],
    }, { columns: 5, background: 'accent-tint', accent: 'blue' }),

    // NEW — national accreditation showcase.
    sectionHeader({
      eyebrow: t('National Accreditation', 'Akreditasi Nasional'),
      heading: t('Institutionally accredited “Unggul” (Excellent)', 'Terakreditasi institusi “Unggul”'),
      intro: t(
        'UK. Petra holds the highest national institutional accreditation from BAN-PT, and contributes to Indonesia’s Diktisaintek Berdampak agenda for higher education with impact.',
        'UK. Petra meraih akreditasi institusi nasional tertinggi dari BAN-PT, serta turut mendukung agenda Diktisaintek Berdampak untuk pendidikan tinggi yang berdampak.',
      ),
    }),

    logoWall({
      logos: [
        { url: U['ban-pt-unggul'], name: 'BAN-PT — Terakreditasi Unggul' },
        { url: U['diktisaintek'], name: 'Diktisaintek Berdampak' },
      ],
    }, { columns: 2 }),

    richText({
      html: {
        en: '<h2>Study Program Accreditation</h2><p>National and international accreditation held by UK. Petra study programs.</p><ul><li><strong>Architecture</strong> — KAAB, BAN-PT, AUN-QA (international)</li><li><strong>Civil Engineering</strong> — LAM Teknik, BAN-PT, IABEE (international)</li><li><strong>Industrial Engineering</strong> — LAM Teknik, IABEE (international)</li><li><strong>Electrical Engineering</strong> — LAM Teknik, IABEE (international)</li><li><strong>Mechanical Engineering</strong> — LAM Teknik, IABEE (international)</li><li><strong>Informatics</strong> — LAM Infokom, IABEE (international)</li><li><strong>Management</strong> — LAMEMBA, AUN-QA (international)</li><li><strong>Accounting</strong> — BAN-PT, AUN-QA (international)</li><li><strong>Communication Science</strong> — BAN-PT, AUN-QA (international)</li><li><strong>Visual Communication Design</strong> — BAN-PT, AQAS (international)</li><li><strong>Interior Design</strong> — BAN-PT, AQAS (international)</li><li><strong>English</strong> — BAN-PT</li><li><strong>Chinese</strong> — BAN-PT</li><li><strong>Food Technology</strong> — BAN-PT</li><li><strong>Medicine</strong> — LAM PTKes</li><li><strong>Dental Medicine</strong> — LAM PTKes</li><li><strong>Elementary Teacher Education</strong> — LAMDIK</li><li><strong>Early Childhood Teacher Education</strong> — BAN-PT</li><li><strong>Literature</strong> — BAN-PT</li><li><strong>Design</strong> — BAN-PT</li><li><strong>Management Science</strong> — LAMEMBA</li><li><strong>Engineer Profession Education</strong> — LAM Teknik</li><li><strong>Medical Doctor Professional Education</strong> — LAM PTKes</li><li><strong>Dentist Professional Education</strong> — LAM PTKes</li></ul>',
        id: '<h2>Akreditasi Program Studi</h2><p>Akreditasi nasional dan internasional yang dimiliki program studi UK. Petra.</p><ul><li><strong>Arsitektur</strong> — KAAB, BAN-PT, AUN-QA (internasional)</li><li><strong>Teknik Sipil</strong> — LAM Teknik, BAN-PT, IABEE (internasional)</li><li><strong>Teknik Industri</strong> — LAM Teknik, IABEE (internasional)</li><li><strong>Teknik Elektro</strong> — LAM Teknik, IABEE (internasional)</li><li><strong>Teknik Mesin</strong> — LAM Teknik, IABEE (internasional)</li><li><strong>Informatika</strong> — LAM Infokom, IABEE (internasional)</li><li><strong>Manajemen</strong> — LAMEMBA, AUN-QA (internasional)</li><li><strong>Akuntansi</strong> — BAN-PT, AUN-QA (internasional)</li><li><strong>Ilmu Komunikasi</strong> — BAN-PT, AUN-QA (internasional)</li><li><strong>Desain Komunikasi Visual</strong> — BAN-PT, AQAS (internasional)</li><li><strong>Desain Interior</strong> — BAN-PT, AQAS (internasional)</li><li><strong>Sastra Inggris</strong> — BAN-PT</li><li><strong>Bahasa Mandarin</strong> — BAN-PT</li><li><strong>Teknologi Pangan</strong> — BAN-PT</li><li><strong>Kedokteran</strong> — LAM PTKes</li><li><strong>Kedokteran Gigi</strong> — LAM PTKes</li><li><strong>PGSD</strong> — LAMDIK</li><li><strong>PG-PAUD</strong> — BAN-PT</li><li><strong>Sastra</strong> — BAN-PT</li><li><strong>Desain</strong> — BAN-PT</li><li><strong>Ilmu Manajemen</strong> — LAMEMBA</li><li><strong>Pendidikan Profesi Insinyur</strong> — LAM Teknik</li><li><strong>Pendidikan Profesi Dokter</strong> — LAM PTKes</li><li><strong>Pendidikan Profesi Dokter Gigi</strong> — LAM PTKes</li></ul>',
      },
    }),

    cta({
      eyebrow: t('Globally recognized', 'Diakui secara global'),
      heading: t('Study a globally accredited degree at Petra', 'Tempuh gelar terakreditasi global di Petra'),
      subcopy: {},
      ctas: [{ href: '/about/programs', label: t('Explore programs', 'Jelajahi program'), newTab: false, variant: 'blue' }],
    }),
  ];
}

// ---------------------------------------------------------------------------
async function main() {
  console.log('Uploading accreditation images…');
  await uploadImages();

  const { data: page, error: pageErr } = await supabase
    .from('pages').select('id, slug').eq('slug', SLUG).single();
  if (pageErr || !page) { console.error(`Page "${SLUG}" not found.`, pageErr?.message ?? ''); process.exit(1); }

  await supabase.from('blocks').delete().eq('page_id', page.id);

  const blocks = buildBlocks();
  const rows = blocks.map((b, position) => ({
    page_id: page.id, type: b.type, position, config: b.config, content: b.content,
  }));
  const { error: insErr } = await supabase.from('blocks').insert(rows);
  if (insErr) { console.error(`Insert failed: ${insErr.message}`); throw insErr; }

  console.log(`✓ Seeded ${rows.length} blocks into "${SLUG}".`);
  console.log('Edit it in /admin → Pages → Accreditation & Rankings.');
}

main().catch((e) => { console.error(e); process.exit(1); });
