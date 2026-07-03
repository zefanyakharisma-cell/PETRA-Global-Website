/**
 * Seed the /mobility/inbound/icop page with source-accurate, bilingual (EN/ID)
 * CMS blocks describing the International Community Outreach Program (iCOP).
 *
 * Content is drawn from the live program site (cop.petra.ac.id): the program's
 * history since 1996, its scale (3,500+ students, 20 universities, 13 countries),
 * its SDG focus areas, recent village projects, a participant testimonial, and
 * the LPPM contact details. Everything is built from standard block types so the
 * International Office can freely restructure it in /admin afterwards.
 *
 *   npm run db:seed:icop
 *
 * SAFE + RE-RUNNABLE: touches only the single `mobility/inbound/icop` page —
 * deletes that page's blocks, then re-inserts, so re-running yields no
 * duplicates and never affects any other page.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS); read from .env.local.
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

const SLUG = 'mobility/inbound/icop';

// --- tiny block builders (mirrors supabase/seed-pages.ts) -------------------
type L = { en: string; id: string };
const t = (en: string, id: string): L => ({ en, id });
type Block = { type: string; config: Record<string, unknown>; content: Record<string, unknown> };
const btn = (label: L, href: string, variant = '') => ({ label, href, variant, newTab: false });

const hero = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'hero', config: { background: 'navy', spacing: 'spacious', layout: 'centered', ...cfg }, content: { ctas: [], ...content },
});
const sectionHeader = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'section_header', config: { background: 'paper', spacing: 'normal', alignment: 'left', accent: 'magenta', ...cfg }, content,
});
const imageText = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'image_text_split', config: { background: 'paper', spacing: 'normal', imageSide: 'left', ...cfg }, content,
});
const featureList = (
  content: { heading?: L; intro?: L; items: { icon: string; title: L; body: L; href?: string }[] },
  cfg: Record<string, unknown> = {},
): Block => ({ type: 'feature_list', config: { background: 'paper', spacing: 'normal', columns: 3, accent: 'magenta', ...cfg }, content });
const statStrip = (stats: { value: string; label: L; auto?: string }[], cfg: Record<string, unknown> = {}): Block => ({
  type: 'stat_strip', config: { background: 'navy', spacing: 'normal', ...cfg }, content: { stats: stats.map((s) => ({ auto: 'none', ...s })) },
});
const cardGrid = (cards: { title: L; body: L; href?: string }[], cfg: Record<string, unknown> = {}): Block => ({
  type: 'card_grid', config: { background: 'paper', spacing: 'normal', source: 'manual', columns: 3, linkToPage: false, ...cfg }, content: { cards },
});
const steps = (content: { heading: L; steps: { title: L; body: L }[] }, cfg: Record<string, unknown> = {}): Block => ({
  type: 'steps', config: { background: 'paper', spacing: 'normal', orientation: 'vertical', ...cfg }, content,
});
const accordion = (content: { heading?: L; items: { q: L; a: L }[] }, cfg: Record<string, unknown> = {}): Block => ({
  type: 'accordion', config: { background: 'paper', spacing: 'normal', openMode: 'multi', ...cfg }, content,
});
const pullQuote = (quote: L, attribution: L, cfg: Record<string, unknown> = {}): Block => ({
  type: 'pull_quote', config: { background: 'navy', spacing: 'spacious', ...cfg }, content: { quote, attribution },
});
const gallery = (cfg: Record<string, unknown> = {}): Block => ({
  type: 'gallery', config: { background: 'paper', spacing: 'normal', columns: 3, ...cfg }, content: { images: [] },
});
const cta = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'cta_banner', config: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'magenta', ...cfg }, content: { ctas: [], ...content },
});

const APPLY = 'https://admission.petra.ac.id';
const M = { accent: 'magenta' } as const;

// ---------------------------------------------------------------------------
// The iCOP page — ordered blocks.
// ---------------------------------------------------------------------------
const BLOCKS: Block[] = [
  hero({
    eyebrow: t('Inbound Programs', 'Program Inbound'),
    heading: t('International Community Outreach Program', 'International Community Outreach Program'),
    subcopy: t(
      'Learn by serving. Since 1996, iCOP has brought international students together with rural Indonesian communities to work side by side on projects that empower local people — an international service-learning program run by Petra’s Institute for Research and Community Outreach (LPPM).',
      'Belajar dengan mengabdi. Sejak 1996, iCOP mempertemukan mahasiswa internasional dengan komunitas pedesaan di Indonesia untuk bekerja berdampingan dalam proyek-proyek yang memberdayakan masyarakat setempat — program pembelajaran-pengabdian internasional yang dikelola Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Petra.',
    ),
    ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Contact iCOP', 'Hubungi iCOP'), 'mailto:cop@petra.ac.id', 'outline')],
  }, M),

  statStrip([
    { value: 'Since 1996', label: t('Running for 29+ years', 'Berjalan lebih dari 29 tahun') },
    { value: '3,500+', label: t('Student participants', 'Mahasiswa peserta') },
    { value: '20', label: t('Partner universities', 'Universitas mitra') },
    { value: '13', label: t('Countries', 'Negara') },
  ]),

  imageText({
    heading: t('An international service-learning program', 'Program pembelajaran-pengabdian internasional'),
    body: t(
      'iCOP is organized by the Institute for Research and Community Outreach (LPPM) of Petra Christian University. It equips participants to understand the real needs of a local community and to contribute meaningfully to its advancement. More than a project, it is a platform for service, cultural exchange, and knowledge-sharing among students from many different backgrounds — working hand in hand with villagers and local government to empower rural communities across Indonesia.',
      'iCOP diselenggarakan oleh Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) Universitas Kristen Petra. Program ini membekali peserta untuk memahami kebutuhan nyata sebuah komunitas lokal dan berkontribusi secara bermakna bagi kemajuannya. Lebih dari sekadar proyek, iCOP menjadi wadah pengabdian, pertukaran budaya, dan berbagi pengetahuan antarmahasiswa dari beragam latar belakang — bekerja bergandengan tangan dengan warga desa dan pemerintah setempat untuk memberdayakan komunitas pedesaan di seluruh Indonesia.',
    ),
  }),

  featureList({
    heading: t('iCOP for the Sustainable Development Goals', 'iCOP untuk Tujuan Pembangunan Berkelanjutan'),
    intro: t(
      'Working with residents and local government, iCOP projects advance community development across several sectors aligned with the SDGs.',
      'Bersama warga dan pemerintah setempat, proyek iCOP memajukan pembangunan komunitas di berbagai sektor yang selaras dengan SDGs.',
    ),
    items: [
      { icon: 'idea', title: t('Renewable energy', 'Energi terbarukan'), body: t('Appropriate, community-scale clean-energy solutions.', 'Solusi energi bersih yang tepat guna dan berskala komunitas.') },
      { icon: 'compass', title: t('Environmental management', 'Pengelolaan lingkungan'), body: t('Caring for and restoring the local environment.', 'Merawat dan memulihkan lingkungan setempat.') },
      { icon: 'globe', title: t('Water resource conservation', 'Konservasi sumber daya air'), body: t('Clean water access, filtration, and irrigation.', 'Akses air bersih, penyaringan, dan irigasi.') },
      { icon: 'book', title: t('Literacy & education', 'Literasi & pendidikan'), body: t('Teaching and learning with local schools and children.', 'Mengajar dan belajar bersama sekolah dan anak-anak setempat.') },
      { icon: 'building', title: t('Local economic development', 'Pengembangan ekonomi lokal'), body: t('Livelihoods, small enterprise, and village tourism.', 'Mata pencaharian, usaha kecil, dan wisata desa.') },
      { icon: 'handshake', title: t('Community empowerment', 'Pemberdayaan masyarakat'), body: t('Social, economic, legal, and governance capacity.', 'Kapasitas sosial, ekonomi, hukum, dan tata kelola.') },
    ],
  }, M),

  sectionHeader({
    eyebrow: t('In the field', 'Di lapangan'),
    heading: t('Recent projects', 'Proyek terkini'),
    intro: t(
      'A snapshot of what iCOP teams have been doing in partner villages across East Java and beyond.',
      'Cuplikan kegiatan tim iCOP di desa-desa mitra di Jawa Timur dan sekitarnya.',
    ),
  }, M),

  cardGrid([
    { title: t('Teaching at SD Sumberjati 2', 'Mengajar di SD Sumberjati 2'), body: t('Education outreach at a local elementary school in Sumberjati.', 'Pengabdian pendidikan di sekolah dasar setempat di Sumberjati.') },
    { title: t('Water filter workshop', 'Lokakarya penyaring air'), body: t('Building and repairing water-filtration systems in Petung, Mojokerto.', 'Membuat dan memperbaiki sistem penyaringan air di Petung, Mojokerto.') },
    { title: t('Pioneering river tourism', 'Merintis wisata sungai'), body: t('Developing the tourism potential of local waterways in Petung, Mojokerto.', 'Mengembangkan potensi wisata perairan setempat di Petung, Mojokerto.') },
    { title: t('Freshwater fish farming', 'Budidaya ikan air tawar'), body: t('Fish-seedling release and hands-on farming training in Kesiman, Mojokerto.', 'Penebaran benih ikan dan pelatihan budidaya langsung di Kesiman, Mojokerto.') },
    { title: t('Spiral pump for irrigation', 'Pompa spiral untuk irigasi'), body: t('Constructing a water pump to irrigate farmland in Weihura.', 'Membangun pompa air untuk mengairi lahan pertanian di Weihura.') },
    { title: t('Clean-water infrastructure', 'Infrastruktur air bersih'), body: t('Water-tank construction in Oelhasusu, Kupang, East Nusa Tenggara.', 'Pembangunan tangki air di Oelhasusu, Kupang, Nusa Tenggara Timur.') },
  ], M),

  gallery({ columns: 3 }),

  steps({
    heading: t('How iCOP works', 'Cara kerja iCOP'),
    steps: [
      { title: t('Apply & get matched', 'Mendaftar & dipasangkan'), body: t('Tell us your interests and skills; we place you with a community project and a cross-cultural team.', 'Sampaikan minat dan keterampilan Anda; kami menempatkan Anda pada proyek komunitas dan tim lintas budaya.') },
      { title: t('Orientation', 'Orientasi'), body: t('Get to know the community, culture, safety, and the goals of your project.', 'Kenali komunitas, budaya, keselamatan, dan tujuan proyek Anda.') },
      { title: t('Live & serve in the village', 'Tinggal & mengabdi di desa'), body: t('Work side by side with villagers, local government, and Petra students on real, hands-on work.', 'Bekerja berdampingan dengan warga desa, pemerintah setempat, dan mahasiswa Petra dalam pekerjaan nyata di lapangan.') },
      { title: t('Reflect & celebrate', 'Refleksi & perayaan'), body: t('Share the impact you made, exchange stories, and complete the program.', 'Bagikan dampak yang Anda buat, bertukar cerita, dan selesaikan program.') },
    ],
  }, M),

  pullQuote(
    t(
      'The first word that came to my mind is astonishing — the scenery, the villagers here, and the Indonesian culture always surprise me.',
      'Kata pertama yang muncul di benak saya adalah menakjubkan — pemandangannya, warga di sini, dan budaya Indonesia selalu membuat saya terkesan.',
    ),
    t('Helen — Fu Jen Catholic University (FJU), Taiwan, iCOP 2023', 'Helen — Fu Jen Catholic University (FJU), Taiwan, iCOP 2023'),
  ),

  accordion({
    heading: t('Good to know', 'Yang perlu diketahui'),
    items: [
      { q: t('Who can join iCOP?', 'Siapa yang dapat mengikuti iCOP?'), a: t('Students from Petra and from our international partner universities. Over the years, participants have come from 20 universities across 13 countries.', 'Mahasiswa dari Petra dan dari universitas mitra internasional kami. Selama ini, peserta berasal dari 20 universitas di 13 negara.') },
      { q: t('Do I need to speak Indonesian?', 'Apakah saya harus bisa berbahasa Indonesia?'), a: t('No. You work in an international, cross-cultural team, and part of the experience is learning language and culture alongside the community.', 'Tidak. Anda bekerja dalam tim internasional lintas budaya, dan bagian dari pengalaman ini adalah belajar bahasa dan budaya bersama komunitas.') },
      { q: t('Where do the projects take place?', 'Di mana proyek berlangsung?'), a: t('In rural partner communities in Indonesia — recent projects have run in villages around Mojokerto in East Java and in Kupang, East Nusa Tenggara.', 'Di komunitas mitra pedesaan di Indonesia — proyek terkini berlangsung di desa-desa sekitar Mojokerto, Jawa Timur, dan di Kupang, Nusa Tenggara Timur.') },
      { q: t('How do I get the dates and details for the next iCOP?', 'Bagaimana cara mengetahui tanggal dan detail iCOP berikutnya?'), a: t('Contact the iCOP team at cop@petra.ac.id or +62 851 6861 9382 for the current schedule, requirements, and how to register.', 'Hubungi tim iCOP di cop@petra.ac.id atau +62 851 6861 9382 untuk jadwal terkini, persyaratan, dan cara pendaftaran.') },
    ],
  }),

  featureList({
    heading: t('Get in touch', 'Hubungi kami'),
    intro: t('The iCOP program office sits within LPPM at Petra Christian University.', 'Kantor program iCOP berada di bawah LPPM Universitas Kristen Petra.'),
    items: [
      { icon: 'mail', title: t('Email', 'Email'), body: t('cop@petra.ac.id', 'cop@petra.ac.id') },
      { icon: 'users', title: t('Phone / WhatsApp', 'Telepon / WhatsApp'), body: t('+62 851 6861 9382', '+62 851 6861 9382') },
      { icon: 'pin', title: t('Office', 'Kantor'), body: t('LPPM, EH 03.03 — Siwalankerto 121–131, Surabaya 60236, East Java, Indonesia.', 'LPPM, EH 03.03 — Siwalankerto 121–131, Surabaya 60236, Jawa Timur, Indonesia.') },
    ],
  }, { ...M, columns: 3 }),

  cta({
    eyebrow: t('Ready to make an impact?', 'Siap memberi dampak?'),
    heading: t('Serve, learn, and grow with iCOP', 'Mengabdi, belajar, dan bertumbuh bersama iCOP'),
    ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Contact iCOP', 'Hubungi iCOP'), 'mailto:cop@petra.ac.id', 'outline')],
  }, M),
];

// ---------------------------------------------------------------------------
async function main() {
  const { data: page, error: pageErr } = await supabase
    .from('pages').select('id, slug').eq('slug', SLUG).single();
  if (pageErr || !page) { console.error(`Page "${SLUG}" not found.`, pageErr?.message ?? ''); process.exit(1); }

  await supabase.from('blocks').delete().eq('page_id', page.id);

  const rows = BLOCKS.map((b, position) => ({
    page_id: page.id, type: b.type, position, config: b.config, content: b.content,
  }));
  const { error: insErr } = await supabase.from('blocks').insert(rows);
  if (insErr) { console.error(`Insert failed: ${insErr.message}`); throw insErr; }

  console.log(`✓ Seeded ${rows.length} blocks into "${SLUG}".`);
  console.log('Edit it in /admin → Pages → International Community Outreach Program.');
}

main().catch((e) => { console.error(e); process.exit(1); });
