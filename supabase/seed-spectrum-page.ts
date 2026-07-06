/**
 * Seed the /mobility/inbound/indonesian-spectrum page with source-accurate,
 * bilingual (EN/ID) CMS blocks describing the Indonesian SPECTRUM program.
 *
 * Content is drawn from the live program site (indonesianspectrum.petra.ac.id):
 * the program is hosted by Petra's General Education Department and offers three
 * study formats — the SPECTRA short course (summer), a one-semester, and a
 * one-year track. The SPECTRA 2026 details (theme, dates, fee, deadline, what is
 * included/excluded, eligibility, how to apply), arrival & campus-life info
 * (transport, accommodation, campus services), and contact details are all
 * captured here. Everything is built from standard block types so the
 * International Office can freely restructure it in /admin afterwards.
 *
 *   npm run db:seed:spectrum
 *
 * SAFE + RE-RUNNABLE: touches only the single `mobility/inbound/indonesian-spectrum`
 * page — deletes that page's blocks, then re-inserts, so re-running yields no
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

const SLUG = 'mobility/inbound/indonesian-spectrum';

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
const tabs = (content: { heading?: L; tabs: { label: L; body: L }[] }, cfg: Record<string, unknown> = {}): Block => ({
  type: 'tabs', config: { background: 'paper', spacing: 'normal', layout: 'top', accent: 'magenta', ...cfg }, content,
});
const events = (
  content: { heading?: L; intro?: L; items: { date: string; endDate?: string; title: L; location?: L; description?: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({ type: 'events', config: { background: 'paper', spacing: 'normal', layout: 'list', hidePast: false, accent: 'magenta', ...cfg }, content });
const accordion = (content: { heading?: L; items: { q: L; a: L }[] }, cfg: Record<string, unknown> = {}): Block => ({
  type: 'accordion', config: { background: 'paper', spacing: 'normal', openMode: 'multi', ...cfg }, content,
});
const gallery = (cfg: Record<string, unknown> = {}): Block => ({
  type: 'gallery', config: { background: 'paper', spacing: 'normal', columns: 3, ...cfg }, content: { images: [] },
});
const cta = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'cta_banner', config: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'magenta', ...cfg }, content: { ctas: [], ...content },
});

const SITE = 'https://indonesianspectrum.petra.ac.id';
const EMAIL = 'mailto:is_pcu@petra.ac.id';
const M = { accent: 'magenta' } as const;

// ---------------------------------------------------------------------------
// The Indonesian SPECTRUM page — ordered blocks.
// ---------------------------------------------------------------------------
const BLOCKS: Block[] = [
  hero({
    eyebrow: t('Inbound Programs', 'Program Inbound'),
    heading: t('Indonesian SPECTRUM', 'Indonesian SPECTRUM'),
    subcopy: t(
      'An immersive academic and cultural program for international students who want to explore Indonesia. Hosted by the General Education Department of Petra Christian University, SPECTRUM blends classroom learning with field activities and community engagement across Indonesia’s diverse ethnic, linguistic, and religious landscape.',
      'Program akademik dan budaya yang imersif bagi mahasiswa internasional yang ingin menjelajahi Indonesia. Diselenggarakan oleh Departemen Pendidikan Umum Universitas Kristen Petra, SPECTRUM memadukan pembelajaran di kelas dengan kegiatan lapangan dan keterlibatan komunitas di tengah keragaman etnis, bahasa, dan agama di Indonesia.',
    ),
    ctas: [btn(t('Apply now', 'Daftar sekarang'), SITE, 'magenta'), btn(t('Contact us', 'Hubungi kami'), EMAIL, 'outline')],
  }, M),

  statStrip([
    { value: '11–26 Aug 2026', label: t('SPECTRA 2026 summer course', 'Kursus musim panas SPECTRA 2026') },
    { value: '€430 / US$500', label: t('Course fee', 'Biaya program') },
    { value: '5 Jun 2026', label: t('Application deadline', 'Batas pendaftaran') },
    { value: '2 cities', label: t('Surabaya & Surakarta', 'Surabaya & Surakarta') },
  ]),

  imageText({
    heading: t('Explore Indonesia, in and beyond the classroom', 'Jelajahi Indonesia, di dalam dan luar kelas'),
    body: t(
      'Indonesian SPECTRUM offers flexible ways to study Indonesia — from the intensive SPECTRA short course to one-semester and one-year tracks. Learning integrates classroom instruction with field activities, cultural workshops, and community engagement, giving you an authentic window into Indonesian language, culture, traditions, and values while you build your proficiency in Bahasa Indonesia.',
      'Indonesian SPECTRUM menawarkan cara belajar yang fleksibel tentang Indonesia — dari kursus singkat intensif SPECTRA hingga jalur satu semester dan satu tahun. Pembelajaran memadukan pengajaran di kelas dengan kegiatan lapangan, lokakarya budaya, dan keterlibatan komunitas, memberi Anda jendela autentik ke bahasa, budaya, tradisi, dan nilai-nilai Indonesia sekaligus meningkatkan kemampuan Bahasa Indonesia Anda.',
    ),
  }),

  featureList({
    heading: t('Three ways to study', 'Tiga pilihan studi'),
    intro: t(
      'Choose the format that fits your goals — a short intensive summer course, a semester, or a full year.',
      'Pilih format yang sesuai dengan tujuan Anda — kursus musim panas singkat yang intensif, satu semester, atau satu tahun penuh.',
    ),
    items: [
      { icon: 'sparkles', title: t('SPECTRA — short course', 'SPECTRA — kursus singkat'), body: t('An intensive summer programme pairing Indonesian language (BIPA) study with rich cultural immersion.', 'Program musim panas intensif yang memadukan studi Bahasa Indonesia (BIPA) dengan imersi budaya yang kaya.') },
      { icon: 'calendar', title: t('One-semester program', 'Program satu semester'), body: t('Deeper academic and cultural immersion over a single semester at Petra.', 'Imersi akademik dan budaya yang lebih mendalam selama satu semester di Petra.') },
      { icon: 'graduation', title: t('One-year program', 'Program satu tahun'), body: t('Comprehensive Indonesian language development and the fullest cultural experience.', 'Pengembangan Bahasa Indonesia yang komprehensif dan pengalaman budaya paling lengkap.') },
    ],
  }, M),

  sectionHeader({
    eyebrow: t('Summer 2026', 'Musim Panas 2026'),
    heading: t('SPECTRA 2026', 'SPECTRA 2026'),
    intro: t(
      '“Bahasa Indonesia: Insights into ASEAN Business Dynamics through Chinese and Javanese Culture” — an intensive short course held 11–26 August 2026 across Surabaya and Surakarta.',
      '“Bahasa Indonesia: Insights into ASEAN Business Dynamics through Chinese and Javanese Culture” — kursus singkat intensif yang berlangsung 11–26 Agustus 2026 di Surabaya dan Surakarta.',
    ),
  }, M),

  featureList({
    heading: t('What you’ll experience', 'Yang akan Anda alami'),
    items: [
      { icon: 'book', title: t('Bahasa Indonesia (BIPA)', 'Bahasa Indonesia (BIPA)'), body: t('Practical Indonesian-language study for foreign speakers, from everyday communication upward.', 'Studi Bahasa Indonesia praktis bagi penutur asing, mulai dari komunikasi sehari-hari.') },
      { icon: 'building', title: t('ASEAN business dynamics', 'Dinamika bisnis ASEAN'), body: t('Insights into Southeast Asian business seen through Chinese and Javanese culture.', 'Wawasan tentang bisnis Asia Tenggara melalui lensa budaya Tionghoa dan Jawa.') },
      { icon: 'sparkles', title: t('Cultural immersion', 'Imersi budaya'), body: t('Interactive cultural, culinary, and social activities woven through the program.', 'Kegiatan budaya, kuliner, dan sosial yang interaktif di sepanjang program.') },
      { icon: 'compass', title: t('Day trips & field visits', 'Kunjungan lapangan'), body: t('Guided day trips, including travel between Surabaya and Surakarta.', 'Kunjungan sehari terpandu, termasuk perjalanan antara Surabaya dan Surakarta.') },
    ],
  }, { ...M, columns: 2 }),

  featureList({
    heading: t('Who should apply', 'Siapa yang sebaiknya mendaftar'),
    intro: t('SPECTRA welcomes students from diverse academic backgrounds who are eager for interdisciplinary learning.', 'SPECTRA menyambut mahasiswa dari beragam latar belakang akademik yang antusias dengan pembelajaran lintas disiplin.'),
    items: [
      { icon: 'globe', title: t('Curious about Indonesia', 'Tertarik pada Indonesia'), body: t('An interest in Indonesian language and Southeast Asian business contexts.', 'Minat pada Bahasa Indonesia dan konteks bisnis Asia Tenggara.') },
      { icon: 'users', title: t('Diverse backgrounds', 'Latar belakang beragam'), body: t('Open to students from many fields who seek interdisciplinary learning.', 'Terbuka bagi mahasiswa dari berbagai bidang yang mencari pembelajaran lintas disiplin.') },
      { icon: 'graduation', title: t('Enrolled students', 'Mahasiswa aktif'), body: t('Currently enrolled in a Bachelor’s or Master’s program.', 'Sedang menempuh program Sarjana (S1) atau Magister (S2).') },
    ],
  }, M),

  featureList({
    heading: t('Fees & what’s included', 'Biaya & yang termasuk'),
    intro: t('The course fee is €430 / US$500 (non-refundable).', 'Biaya program adalah €430 / US$500 (tidak dapat dikembalikan).'),
    items: [
      { icon: 'award', title: t('Course fee', 'Biaya program'), body: t('€430 / US$500, non-refundable.', '€430 / US$500, tidak dapat dikembalikan.') },
      { icon: 'heart', title: t('Included', 'Termasuk'), body: t('Lectures, materials, workshops, day trips, Surabaya–Surakarta travel, library & internet access, and scheduled meals.', 'Kuliah, materi, lokakarya, kunjungan sehari, perjalanan Surabaya–Surakarta, akses perpustakaan & internet, dan makan terjadwal.') },
      { icon: 'pin', title: t('Not included', 'Tidak termasuk'), body: t('Visa, accommodation, and personal living expenses.', 'Visa, akomodasi, dan biaya hidup pribadi.') },
    ],
  }, M),

  gallery({ columns: 3 }),

  steps({
    heading: t('How to apply', 'Cara mendaftar'),
    steps: [
      { title: t('Complete the online application', 'Isi formulir pendaftaran daring'), body: t('Fill out the online application form before the 5 June 2026 deadline.', 'Lengkapi formulir pendaftaran daring sebelum batas waktu 5 Juni 2026.') },
      { title: t('Pay the course fee', 'Bayar biaya program'), body: t('Settle the €430 / US$500 course fee to confirm your place.', 'Lunasi biaya program €430 / US$500 untuk mengonfirmasi tempat Anda.') },
      { title: t('Receive your confirmation', 'Terima konfirmasi Anda'), body: t('Get your enrollment confirmation letter by email and prepare to arrive.', 'Terima surat konfirmasi pendaftaran melalui email dan bersiap untuk tiba.') },
    ],
  }, M),

  events({
    heading: t('Key dates — SPECTRA 2026', 'Tanggal penting — SPECTRA 2026'),
    items: [
      { date: '2026-06-05', title: t('Application deadline', 'Batas pendaftaran'), description: t('Last day to submit the online application form.', 'Hari terakhir mengirimkan formulir pendaftaran daring.') },
      { date: '2026-08-11', endDate: '2026-08-26', title: t('SPECTRA 2026 program', 'Program SPECTRA 2026'), location: t('Surabaya & Surakarta, Indonesia', 'Surabaya & Surakarta, Indonesia'), description: t('Two weeks of intensive language study and cultural immersion.', 'Dua minggu studi bahasa intensif dan imersi budaya.') },
    ],
  }, M),

  tabs({
    heading: t('Arrival & campus life', 'Kedatangan & kehidupan kampus'),
    tabs: [
      {
        label: t('Getting here', 'Menuju kampus'),
        body: t(
          'From Juanda International Airport (SUB), several options reach campus: Bluebird taxi (metered, roughly IDR 71,000–97,000, or a fixed IDR 96,000), Prima Taxi (about IDR 120,000), Grab (GrabCar Airport from IDR 170,000–210,000), and Gojek (GoCar XL from IDR 165,000–210,000). Book at the airport counter or via the respective apps.',
          'Dari Bandara Internasional Juanda (SUB), tersedia beberapa pilihan menuju kampus: taksi Bluebird (argo, sekitar IDR 71.000–97.000, atau tarif tetap IDR 96.000), Prima Taxi (sekitar IDR 120.000), Grab (GrabCar Airport mulai IDR 170.000–210.000), dan Gojek (GoCar XL mulai IDR 165.000–210.000). Pesan di konter bandara atau melalui aplikasi masing-masing.',
        ),
      },
      {
        label: t('Accommodation', 'Akomodasi'),
        body: t(
          'Recommended hotels near campus (about 12 minutes away): Luminor Hotel Jemursari (from Rp 620,000/night), The Capital Hotel Surabaya (from Rp 460,000/night), YELLO Hotel Jemursari (from Rp 400,000/night), and The Southern Hotel Surabaya (from Rp 450,000/night). Accommodation is arranged by participants and is not included in the course fee.',
          'Hotel yang direkomendasikan di dekat kampus (sekitar 12 menit): Luminor Hotel Jemursari (mulai Rp 620.000/malam), The Capital Hotel Surabaya (mulai Rp 460.000/malam), YELLO Hotel Jemursari (mulai Rp 400.000/malam), dan The Southern Hotel Surabaya (mulai Rp 450.000/malam). Akomodasi diatur sendiri oleh peserta dan tidak termasuk dalam biaya program.',
        ),
      },
      {
        label: t('Campus services', 'Layanan kampus'),
        body: t(
          'Library: Mon–Fri 08:00–18:45, Sat 09:00–14:45 (closed Sunday). Health Clinic: general services 08:00–12:00 and 13:00–14:00 daily, with dental care Mon–Fri. Sky Fit Gym: Q Building, 12th floor — free for students with advance booking.',
          'Perpustakaan: Sen–Jum 08.00–18.45, Sab 09.00–14.45 (tutup Minggu). Klinik Kesehatan: layanan umum 08.00–12.00 dan 13.00–14.00 setiap hari, dengan layanan gigi Sen–Jum. Sky Fit Gym: Gedung Q lantai 12 — gratis untuk mahasiswa dengan pemesanan terlebih dahulu.',
        ),
      },
    ],
  }, M),

  accordion({
    heading: t('Good to know', 'Yang perlu diketahui'),
    items: [
      { q: t('Do I need to speak Indonesian already?', 'Apakah saya harus sudah bisa berbahasa Indonesia?'), a: t('No. SPECTRA’s language study (BIPA) is designed for foreign speakers, and part of the experience is learning the language and culture together on the ground.', 'Tidak. Studi bahasa SPECTRA (BIPA) dirancang untuk penutur asing, dan bagian dari pengalaman ini adalah belajar bahasa dan budaya secara langsung bersama-sama.') },
      { q: t('Who can apply?', 'Siapa yang dapat mendaftar?'), a: t('Students from diverse academic backgrounds who are currently enrolled in a Bachelor’s or Master’s program and interested in Indonesian language and Southeast Asian business.', 'Mahasiswa dari beragam latar belakang akademik yang sedang menempuh program Sarjana (S1) atau Magister (S2) dan tertarik pada Bahasa Indonesia serta bisnis Asia Tenggara.') },
      { q: t('Is accommodation provided?', 'Apakah akomodasi disediakan?'), a: t('No. The course fee does not cover accommodation, visa, or personal living expenses. We recommend several hotels near campus in the Arrival & campus life section.', 'Tidak. Biaya program tidak mencakup akomodasi, visa, atau biaya hidup pribadi. Kami merekomendasikan beberapa hotel di dekat kampus pada bagian Kedatangan & kehidupan kampus.') },
      { q: t('How do I get the latest schedule and details?', 'Bagaimana cara mengetahui jadwal dan detail terbaru?'), a: t('Contact the Indonesian SPECTRUM office at is_pcu@petra.ac.id or +62 815 5370 3333.', 'Hubungi kantor Indonesian SPECTRUM di is_pcu@petra.ac.id atau +62 815 5370 3333.') },
    ],
  }),

  featureList({
    heading: t('Get in touch', 'Hubungi kami'),
    intro: t('Indonesian SPECTRUM is hosted by the General Education Department of Petra Christian University.', 'Indonesian SPECTRUM diselenggarakan oleh Departemen Pendidikan Umum Universitas Kristen Petra.'),
    items: [
      { icon: 'mail', title: t('Email', 'Email'), body: t('is_pcu@petra.ac.id', 'is_pcu@petra.ac.id') },
      { icon: 'users', title: t('Phone / WhatsApp', 'Telepon / WhatsApp'), body: t('+62 815 5370 3333', '+62 815 5370 3333') },
      { icon: 'pin', title: t('Campus', 'Kampus'), body: t('Jl. Siwalankerto 121–131, Surabaya, East Java 60236, Indonesia.', 'Jl. Siwalankerto 121–131, Surabaya, Jawa Timur 60236, Indonesia.') },
    ],
  }, { ...M, columns: 3 }),

  cta({
    eyebrow: t('Ready to explore Indonesia?', 'Siap menjelajahi Indonesia?'),
    heading: t('Join Indonesian SPECTRUM', 'Bergabunglah dengan Indonesian SPECTRUM'),
    ctas: [btn(t('Apply now', 'Daftar sekarang'), SITE, 'magenta'), btn(t('Contact us', 'Hubungi kami'), EMAIL, 'outline')],
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
  console.log('Edit it in /admin → Pages → Indonesian SPECTRUM.');
}

main().catch((e) => { console.error(e); process.exit(1); });
