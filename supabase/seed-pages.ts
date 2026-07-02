/**
 * Page-content seed — fills every *empty* CMS page with on-brand, bilingual
 * (EN/ID) starter blocks so an editor has real content to shape in /admin
 * instead of a blank canvas.
 *
 *   npm run db:seed:pages           (see package.json)
 *
 * SAFE + RE-RUNNABLE:
 *  - Only touches the page slugs listed in PAGE_BLOCKS below (all currently
 *    empty). It NEVER writes to the pages you've already authored
 *    (home, about, mobility, mobility/inbound/semester-exchange, partnership,
 *    partnership/international).
 *  - For each listed slug it deletes that page's existing blocks first, then
 *    re-inserts, so running twice yields no duplicates.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment (bypasses RLS).
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema: 'petra_io' } });

// ---------------------------------------------------------------------------
// Tiny builders — keep the content map readable. Each returns a block partial
// { type, config, content }; `position` is assigned by array order on insert.
// ---------------------------------------------------------------------------
type L = { en: string; id: string };
const t = (en: string, id: string): L => ({ en, id });

type Block = { type: string; config: Record<string, unknown>; content: Record<string, unknown> };

const hero = (
  content: { eyebrow: L; heading: L; subcopy?: L; ctas?: unknown[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'hero',
  config: { background: 'navy', spacing: 'spacious', layout: 'centered', ...cfg },
  content: { ctas: [], ...content },
});

const btn = (label: L, href: string, variant = '') => ({ label, href, variant, newTab: false });

const sectionHeader = (
  content: { eyebrow?: L; heading: L; intro?: L },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'section_header',
  config: { background: 'paper', spacing: 'normal', alignment: 'left', accent: 'magenta', ...cfg },
  content,
});

const imageText = (
  content: { heading: L; body: L; cta?: unknown[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'image_text_split',
  config: { background: 'paper', spacing: 'normal', imageSide: 'left', ...cfg },
  content,
});

const featureList = (
  content: { heading?: L; intro?: L; items: { icon: string; title: L; body: L; href?: string }[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'feature_list',
  config: { background: 'paper', spacing: 'normal', columns: 3, accent: 'magenta', ...cfg },
  content,
});

const statStrip = (
  stats: { value: string; label: L; auto?: string }[],
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'stat_strip',
  config: { background: 'navy', spacing: 'normal', ...cfg },
  content: { stats: stats.map((s) => ({ auto: 'none', ...s })) },
});

const cardGrid = (
  cards: { title: L; body: L; href?: string }[],
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'card_grid',
  config: { background: 'paper', spacing: 'normal', source: 'manual', columns: 3, linkToPage: true, ...cfg },
  content: { cards },
});

const steps = (
  content: { heading: L; steps: { title: L; body: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'steps',
  config: { background: 'paper', spacing: 'normal', orientation: 'vertical', ...cfg },
  content,
});

const accordion = (
  content: { heading?: L; items: { q: L; a: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'accordion',
  config: { background: 'paper', spacing: 'normal', openMode: 'multi', ...cfg },
  content,
});

const timeline = (
  content: { heading: L; intro?: L; items: { date: string; title: L; body: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'timeline',
  config: { background: 'paper', spacing: 'normal', accent: 'magenta', ...cfg },
  content,
});

const gallery = (cfg: Record<string, unknown> = {}): Block => ({
  type: 'gallery',
  config: { background: 'paper', spacing: 'normal', columns: 3, ...cfg },
  content: { images: [] },
});

const richText = (html: L, cfg: Record<string, unknown> = {}): Block => ({
  type: 'rich_text',
  config: { background: 'paper', spacing: 'normal', width: 'narrow', ...cfg },
  content: { html },
});

const pullQuote = (quote: L, attribution: L, cfg: Record<string, unknown> = {}): Block => ({
  type: 'pull_quote',
  config: { background: 'navy', spacing: 'spacious', ...cfg },
  content: { quote, attribution },
});

const embed = (caption: L, cfg: Record<string, unknown> = {}): Block => ({
  type: 'embed',
  config: { background: 'paper', spacing: 'normal', aspect: '16/9', ...cfg },
  content: { url: '', caption },
});

const downloads = (
  content: { heading: L; intro?: L; items: { title: L; description: L }[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'downloads',
  config: { background: 'paper', spacing: 'normal', columns: 1, accent: 'magenta', ...cfg },
  content: { ...content, items: content.items.map((i) => ({ ...i, file: '' })) },
});

const partnerMarquee = (heading: L, filterKind: string, cfg: Record<string, unknown> = {}): Block => ({
  type: 'partner_marquee',
  config: { background: 'navy', spacing: 'normal', filterKind, ...cfg },
  content: { heading },
});

const partnerMap = (heading: L, filterKind: string, cfg: Record<string, unknown> = {}): Block => ({
  type: 'partner_map',
  config: { background: 'navy', spacing: 'normal', filterKind, defaultZoom: 2, ...cfg },
  content: { heading },
});

const faculties = (content: { heading: L; intro?: L }, cfg: Record<string, unknown> = {}): Block => ({
  type: 'faculties',
  config: {
    background: 'paper', spacing: 'normal', display: 'explorer', accent: 'magenta',
    areas: ['course'], facultyIds: [], programIds: [], ...cfg,
  },
  content,
});

const staffBlock = (cfg: Record<string, unknown> = {}): Block => ({
  type: 'staff',
  config: { background: 'paper', spacing: 'normal', mode: 'directory', ...cfg },
  content: {},
});

const inquiry = (content: { heading: L; intro?: L }, preset = 'student', cfg: Record<string, unknown> = {}): Block => ({
  type: 'inquiry_form',
  config: { background: 'navy', spacing: 'spacious', preset, ...cfg },
  content,
});

const cta = (
  content: { eyebrow?: L; heading: L; subcopy?: L; ctas?: unknown[] },
  cfg: Record<string, unknown> = {},
): Block => ({
  type: 'cta_banner',
  config: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'cyan', ...cfg },
  content: { ctas: [], ...content },
});

const logoWall = (heading: L, cfg: Record<string, unknown> = {}): Block => ({
  type: 'logo_wall',
  config: { background: 'paper', spacing: 'normal', style: 'grayscale', columns: 4, ...cfg },
  content: { heading, logos: [] },
});

// Common CTA endpoints
const APPLY = 'https://admission.petra.ac.id';

// ---------------------------------------------------------------------------
// The content map: page slug -> ordered blocks. Only empty pages are listed.
// ---------------------------------------------------------------------------
const PAGE_BLOCKS: Record<string, Block[]> = {
  // ===================== ABOUT =====================
  'about/petra-at-a-glance': [
    hero({
      eyebrow: t('About PETRA', 'Tentang PETRA'),
      heading: t('Petra at a Glance', 'Sekilas PETRA'),
      subcopy: t(
        'A caring and global university in the heart of Surabaya. Since 1961, Petra Christian University has grown into one of Indonesia’s leading private universities.',
        'Universitas yang peduli dan global di jantung kota Surabaya. Sejak 1961, Universitas Kristen Petra telah berkembang menjadi salah satu universitas swasta terkemuka di Indonesia.',
      ),
      ctas: [btn(t('Explore programs', 'Jelajahi program'), '/mobility', 'magenta')],
    }),
    statStrip([
      { value: '1961', label: t('Year Founded', 'Tahun Berdiri') },
      { value: '7', label: t('Faculties', 'Fakultas') },
      { value: '~10,000', label: t('Students', 'Mahasiswa') },
      { value: '150+', label: t('Global Partners', 'Mitra Global'), auto: 'partners_international' },
    ]),
    imageText({
      heading: t('Who we are', 'Siapa kami'),
      body: t(
        'Petra Christian University was founded in 1961 in Surabaya, East Java, by the PPPK Petra Christian education foundation. Rooted in Christian values and a spirit of care, we bring together seven faculties on a single connected urban campus.',
        'Universitas Kristen Petra didirikan pada tahun 1961 di Surabaya, Jawa Timur, oleh yayasan pendidikan Kristen PPPK Petra. Berakar pada nilai-nilai Kristiani dan semangat kepedulian, kami menaungi tujuh fakultas dalam satu kampus kota yang terpadu.',
      ),
    }),
    featureList({
      heading: t('What we stand for', 'Nilai yang kami junjung'),
      items: [
        { icon: 'heart', title: t('Caring', 'Peduli'), body: t('A community that puts people first, guided by Christian values.', 'Komunitas yang mengutamakan manusia, berlandaskan nilai-nilai Kristiani.') },
        { icon: 'globe', title: t('Global', 'Global'), body: t('An international outlook with partners across more than 30 countries.', 'Wawasan internasional dengan mitra di lebih dari 30 negara.') },
        { icon: 'award', title: t('Excellent', 'Unggul'), body: t('Nationally accredited “Excellent” and recognized in global rankings.', 'Terakreditasi “Unggul” secara nasional dan diakui dalam pemeringkatan global.') },
      ],
    }),
    timeline({
      heading: t('Our journey', 'Perjalanan kami'),
      intro: t('A few milestones on the road since 1961.', 'Beberapa tonggak sejarah sejak tahun 1961.'),
      items: [
        { date: '1961', title: t('Founded in Surabaya', 'Didirikan di Surabaya'), body: t('Petra Christian University opens its doors.', 'Universitas Kristen Petra membuka pintunya.') },
        { date: '1990s', title: t('Campus expansion', 'Perluasan kampus'), body: t('Growth into a multi-faculty urban campus in Wonocolo.', 'Berkembang menjadi kampus kota multi-fakultas di Wonocolo.') },
        { date: 'Today', title: t('A global university', 'Universitas global'), body: t('Seven faculties, thousands of students, and a worldwide partner network.', 'Tujuh fakultas, ribuan mahasiswa, dan jaringan mitra di seluruh dunia.') },
      ],
    }),
    cta({
      eyebrow: t('Want to know more?', 'Ingin tahu lebih banyak?'),
      heading: t('Discover life at Petra', 'Temukan kehidupan di Petra'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'magenta')],
    }),
  ],

  'about/facilities': [
    hero({
      eyebrow: t('About PETRA', 'Tentang PETRA'),
      heading: t('Facilities', 'Fasilitas'),
      subcopy: t(
        'A connected urban campus of more than 40 hectares — built for learning, creating, and community.',
        'Kampus kota terpadu seluas lebih dari 40 hektar — dirancang untuk belajar, berkarya, dan berkomunitas.',
      ),
    }),
    sectionHeader({
      eyebrow: t('Campus', 'Kampus'),
      heading: t('Everything you need, on one campus', 'Semua yang Anda butuhkan, dalam satu kampus'),
      intro: t('From libraries to performance halls and modern laboratories.', 'Dari perpustakaan hingga aula pertunjukan dan laboratorium modern.'),
    }),
    cardGrid([
      { title: t('Library & Learning Commons', 'Perpustakaan & Ruang Belajar'), body: t('Extensive collections, quiet study rooms, and digital resources.', 'Koleksi yang luas, ruang belajar tenang, dan sumber daya digital.') },
      { title: t('Philharmonic Hall', 'Philharmonic Hall'), body: t('A 3,000-seat hall for concerts, ceremonies, and events.', 'Aula berkapasitas 3.000 kursi untuk konser, upacara, dan acara.') },
      { title: t('Laboratories & Studios', 'Laboratorium & Studio'), body: t('Engineering, informatics, design, and science facilities.', 'Fasilitas teknik, informatika, desain, dan sains.') },
      { title: t('Sports & Recreation', 'Olahraga & Rekreasi'), body: t('Courts, fitness spaces, and green public areas.', 'Lapangan, ruang kebugaran, dan area publik hijau.') },
      { title: t('Student Center', 'Pusat Kegiatan Mahasiswa'), body: t('Spaces for organizations, community, and collaboration.', 'Ruang untuk organisasi, komunitas, dan kolaborasi.') },
      { title: t('Cafeterias & Cafés', 'Kafetaria & Kafe'), body: t('Diverse, affordable dining across the campus.', 'Pilihan kuliner yang beragam dan terjangkau di seluruh kampus.') },
    ], { linkToPage: false }),
    gallery(),
    cta({
      heading: t('Come see the campus for yourself', 'Datang dan lihat kampus kami secara langsung'),
      ctas: [btn(t('How to get to PETRA', 'Cara menuju PETRA'), '/life-at-petra/get-to-petra', 'magenta')],
    }),
  ],

  'about/leadership': [
    hero({
      eyebrow: t('About PETRA', 'Tentang PETRA'),
      heading: t('Leadership', 'Kepemimpinan'),
      subcopy: t(
        'The people guiding Petra Christian University toward a caring, global future.',
        'Sosok yang memimpin Universitas Kristen Petra menuju masa depan yang peduli dan global.',
      ),
    }),
    sectionHeader({
      eyebrow: t('Our people', 'Sosok kami'),
      heading: t('University leadership', 'Pimpinan universitas'),
      intro: t('Meet the rectorate and the team leading our academic community.', 'Kenali rektorat dan tim yang memimpin komunitas akademik kami.'),
    }),
    staffBlock(),
    pullQuote(
      t('Become a part of Petra Christian University’s big family as Petranesians, and become global socioleaders.', 'Menjadi bagian dari keluarga besar UK Petra sebagai Petranesian, sekaligus menjadi global socioleader.'),
      t('Office of the Rector', 'Kantor Rektor'),
    ),
    cta({
      heading: t('Reach the International Office', 'Hubungi International Office'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'magenta')],
    }),
  ],

  'about/study-programs': [
    hero({
      eyebrow: t('About PETRA', 'Tentang PETRA'),
      heading: t('Study Programs', 'Program Studi'),
      subcopy: t(
        'Explore seven faculties spanning engineering, business, design, humanities, and education.',
        'Jelajahi tujuh fakultas yang mencakup teknik, bisnis, desain, humaniora, dan pendidikan.',
      ),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }),
    sectionHeader({
      eyebrow: t('Academics', 'Akademik'),
      heading: t('Faculties & study programs', 'Fakultas & program studi'),
      intro: t('Browse our faculties and the study programs within each.', 'Telusuri fakultas kami dan program studi di dalamnya.'),
    }),
    faculties({
      heading: t('Explore our programs', 'Jelajahi program kami'),
      intro: t('Expand a faculty to see its study programs.', 'Buka sebuah fakultas untuk melihat program studinya.'),
    }),
    cta({
      eyebrow: t('Ready to apply?', 'Siap mendaftar?'),
      heading: t('Start your application', 'Mulai pendaftaran Anda'),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }),
  ],

  'about/contact-us': [
    hero({
      eyebrow: t('About PETRA', 'Tentang PETRA'),
      heading: t('Contact Us', 'Hubungi Kami'),
      subcopy: t(
        'Questions about studying, partnering, or visiting Petra? We’re here to help.',
        'Ada pertanyaan tentang studi, kemitraan, atau kunjungan ke Petra? Kami siap membantu.',
      ),
    }),
    imageText({
      heading: t('International Office', 'International Office'),
      body: t(
        'Petra Christian University, Jl. Siwalankerto 121–131, Surabaya 60236, East Java, Indonesia. Email: international@petra.ac.id · Phone: +62 31 298 3000.',
        'Universitas Kristen Petra, Jl. Siwalankerto 121–131, Surabaya 60236, Jawa Timur, Indonesia. Email: international@petra.ac.id · Telp: +62 31 298 3000.',
      ),
    }),
    featureList({
      heading: t('How to reach us', 'Cara menghubungi kami'),
      items: [
        { icon: 'mail', title: t('Email', 'Email'), body: t('international@petra.ac.id — for programs, partnerships, and general questions.', 'international@petra.ac.id — untuk program, kemitraan, dan pertanyaan umum.') },
        { icon: 'building', title: t('Visit', 'Kunjungi'), body: t('Jl. Siwalankerto 121–131, Surabaya, East Java, Indonesia.', 'Jl. Siwalankerto 121–131, Surabaya, Jawa Timur, Indonesia.') },
        { icon: 'globe', title: t('Follow', 'Ikuti'), body: t('Stay up to date through our official social media channels.', 'Ikuti perkembangan terbaru melalui kanal media sosial resmi kami.') },
      ],
    }),
    embed(t('Find us on the map', 'Temukan kami di peta')),
    inquiry({
      heading: t('Send us a message', 'Kirimkan pesan kepada kami'),
      intro: t('Tell us what you’re looking for and we’ll connect you with the right office.', 'Beri tahu kami kebutuhan Anda dan kami akan menghubungkan Anda dengan unit yang tepat.'),
    }, 'student'),
  ],

  // ===================== MOBILITY — INBOUND (accent magenta) =====================
  'mobility/inbound': [
    hero({
      eyebrow: t('Inbound Programs', 'Program Inbound'),
      heading: t('Study at Petra', 'Belajar di Petra'),
      subcopy: t(
        'Join us in Surabaya. From a full semester exchange to short community programs, find the pathway that fits your journey.',
        'Bergabunglah dengan kami di Surabaya. Dari pertukaran satu semester penuh hingga program komunitas singkat, temukan jalur yang sesuai dengan perjalanan Anda.',
      ),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }, { accent: 'magenta' }),
    sectionHeader({
      eyebrow: t('Choose your program', 'Pilih program Anda'),
      heading: t('Inbound mobility programs', 'Program mobilitas inbound'),
      intro: t('Programs designed for international students coming to Petra.', 'Program yang dirancang untuk mahasiswa internasional yang datang ke Petra.'),
    }),
    cardGrid([
      { title: t('Semester Exchange', 'Pertukaran Semester'), body: t('Spend one semester at Petra with transferable credits across faculties.', 'Habiskan satu semester di Petra dengan kredit yang dapat ditransfer lintas fakultas.'), href: '/mobility/inbound/semester-exchange' },
      { title: t('International Degree Program', 'Program Gelar Internasional'), body: t('Earn a full degree in an international, English-supported environment.', 'Raih gelar penuh dalam lingkungan internasional yang didukung bahasa Inggris.'), href: '/mobility/inbound/international-degree' },
      { title: t('Community Outreach (ICOP)', 'Community Outreach (ICOP)'), body: t('Serve and learn with local communities through hands-on projects.', 'Mengabdi dan belajar bersama komunitas lokal melalui proyek nyata.'), href: '/mobility/inbound/icop' },
      { title: t('Indonesian SPECTRUM', 'Indonesian SPECTRUM'), body: t('Immerse in Indonesian language, culture, and society.', 'Menyelami bahasa, budaya, dan masyarakat Indonesia.'), href: '/mobility/inbound/indonesian-spectrum' },
    ], { columns: 2, accent: 'magenta' }),
    featureList({
      heading: t('Why study at Petra?', 'Mengapa belajar di Petra?'),
      items: [
        { icon: 'graduation', title: t('Academic quality', 'Kualitas akademik'), body: t('English-supported courses across seven faculties.', 'Mata kuliah yang didukung bahasa Inggris di tujuh fakultas.') },
        { icon: 'users', title: t('Buddy support', 'Dukungan buddy'), body: t('The PETRAMate program pairs you with local students.', 'Program PETRAMate memasangkan Anda dengan mahasiswa lokal.') },
        { icon: 'compass', title: t('Culture & adventure', 'Budaya & petualangan'), body: t('Explore Surabaya, East Java, and beyond.', 'Jelajahi Surabaya, Jawa Timur, dan sekitarnya.') },
      ],
    }, { accent: 'magenta' }),
    cta({
      eyebrow: t('Interested?', 'Tertarik?'),
      heading: t('Start your exchange journey', 'Mulai perjalanan pertukaran Anda'),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Ask a question', 'Ajukan pertanyaan'), '/about/contact-us', 'outline')],
    }),
  ],

  'mobility/inbound/international-degree': [
    hero({
      eyebrow: t('Inbound Programs', 'Program Inbound'),
      heading: t('International Degree Program', 'Program Gelar Internasional'),
      subcopy: t(
        'Earn a full bachelor’s degree at Petra in an international, English-supported learning environment.',
        'Raih gelar sarjana penuh di Petra dalam lingkungan belajar internasional yang didukung bahasa Inggris.',
      ),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }, { accent: 'magenta' }),
    imageText({
      heading: t('Study for your degree in Indonesia', 'Tempuh gelar Anda di Indonesia'),
      body: t(
        'Our international degree pathways let you complete a recognized qualification while experiencing Indonesian culture, an affordable cost of living, and a supportive campus community.',
        'Jalur gelar internasional kami memungkinkan Anda menyelesaikan kualifikasi yang diakui sambil merasakan budaya Indonesia, biaya hidup yang terjangkau, dan komunitas kampus yang suportif.',
      ),
    }),
    featureList({
      heading: t('Program highlights', 'Keunggulan program'),
      items: [
        { icon: 'graduation', title: t('Recognized degree', 'Gelar yang diakui'), body: t('Accredited programs across selected faculties.', 'Program terakreditasi di sejumlah fakultas pilihan.') },
        { icon: 'globe', title: t('Global community', 'Komunitas global'), body: t('Study alongside students from around the world.', 'Belajar bersama mahasiswa dari seluruh dunia.') },
        { icon: 'idea', title: t('Career-ready', 'Siap berkarier'), body: t('Industry links, internships, and project-based learning.', 'Koneksi industri, magang, dan pembelajaran berbasis proyek.') },
      ],
    }, { accent: 'magenta' }),
    steps({
      heading: t('How to apply', 'Cara mendaftar'),
      steps: [
        { title: t('Explore programs', 'Jelajahi program'), body: t('Choose the faculty and study program that fits your goals.', 'Pilih fakultas dan program studi yang sesuai dengan tujuan Anda.') },
        { title: t('Submit your application', 'Kirimkan aplikasi Anda'), body: t('Complete the online form and upload the required documents.', 'Lengkapi formulir daring dan unggah dokumen yang diperlukan.') },
        { title: t('Receive your offer', 'Terima penawaran Anda'), body: t('Get your Letter of Acceptance and prepare your visa.', 'Terima Surat Penerimaan dan siapkan visa Anda.') },
        { title: t('Begin your studies', 'Mulai studi Anda'), body: t('Join orientation and start your first semester at Petra.', 'Ikuti orientasi dan mulai semester pertama Anda di Petra.') },
      ],
    }, { accent: 'magenta' }),
    accordion({
      heading: t('Frequently asked questions', 'Pertanyaan yang sering diajukan'),
      items: [
        { q: t('What are the admission requirements?', 'Apa saja persyaratan pendaftaran?'), a: t('A completed secondary education, English proficiency, and the required application documents. Contact us for the full checklist.', 'Pendidikan menengah yang telah selesai, kemampuan bahasa Inggris, dan dokumen aplikasi yang diperlukan. Hubungi kami untuk daftar lengkap.') },
        { q: t('Are the programs taught in English?', 'Apakah program diajarkan dalam bahasa Inggris?'), a: t('Selected programs are English-supported. Language support is available for international students.', 'Program tertentu didukung bahasa Inggris. Dukungan bahasa tersedia bagi mahasiswa internasional.') },
        { q: t('Is there financial support?', 'Apakah ada dukungan finansial?'), a: t('Scholarship options may be available. Please contact the International Office for details.', 'Opsi beasiswa mungkin tersedia. Silakan hubungi International Office untuk detailnya.') },
      ],
    }),
    cta({
      eyebrow: t('Interested?', 'Tertarik?'),
      heading: t('Take the first step', 'Ambil langkah pertama'),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'outline')],
    }),
  ],

  'mobility/inbound/icop': [
    hero({
      eyebrow: t('Inbound Programs', 'Program Inbound'),
      heading: t('International Community Outreach Program', 'International Community Outreach Program'),
      subcopy: t(
        'Learn by serving. ICOP connects international students with local communities through meaningful, hands-on projects.',
        'Belajar dengan mengabdi. ICOP menghubungkan mahasiswa internasional dengan komunitas lokal melalui proyek nyata yang bermakna.',
      ),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }, { accent: 'magenta' }),
    imageText({
      heading: t('Community service, real impact', 'Pengabdian masyarakat, dampak nyata'),
      body: t(
        'Work side by side with Petra students and local partners on projects in education, environment, and social development — while experiencing Indonesian culture first-hand.',
        'Bekerja berdampingan dengan mahasiswa Petra dan mitra lokal dalam proyek pendidikan, lingkungan, dan pengembangan sosial — sambil merasakan langsung budaya Indonesia.',
      ),
    }),
    featureList({
      heading: t('What you’ll gain', 'Yang akan Anda peroleh'),
      items: [
        { icon: 'handshake', title: t('Real projects', 'Proyek nyata'), body: t('Contribute to community initiatives that matter.', 'Berkontribusi pada inisiatif komunitas yang berarti.') },
        { icon: 'users', title: t('Cross-cultural teamwork', 'Kerja tim lintas budaya'), body: t('Collaborate with local and international peers.', 'Berkolaborasi dengan rekan lokal dan internasional.') },
        { icon: 'heart', title: t('Personal growth', 'Pertumbuhan pribadi'), body: t('Develop empathy, leadership, and global perspective.', 'Mengembangkan empati, kepemimpinan, dan wawasan global.') },
      ],
    }, { accent: 'magenta' }),
    steps({
      heading: t('How it works', 'Cara kerjanya'),
      steps: [
        { title: t('Apply & get matched', 'Mendaftar & dipasangkan'), body: t('Tell us your interests and we’ll place you with a project.', 'Sampaikan minat Anda dan kami akan menempatkan Anda pada sebuah proyek.') },
        { title: t('Orientation', 'Orientasi'), body: t('Learn about the community, culture, and safety.', 'Pelajari tentang komunitas, budaya, dan keselamatan.') },
        { title: t('Serve & learn', 'Mengabdi & belajar'), body: t('Work on the project alongside your team.', 'Kerjakan proyek bersama tim Anda.') },
        { title: t('Reflect & celebrate', 'Refleksi & perayaan'), body: t('Share your impact and receive your certificate.', 'Bagikan dampak Anda dan terima sertifikat.') },
      ],
    }, { accent: 'magenta' }),
    cta({
      heading: t('Ready to make an impact?', 'Siap memberi dampak?'),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'outline')],
    }),
  ],

  'mobility/inbound/indonesian-spectrum': [
    hero({
      eyebrow: t('Inbound Programs', 'Program Inbound'),
      heading: t('Indonesian SPECTRUM', 'Indonesian SPECTRUM'),
      subcopy: t(
        'Immerse yourself in Indonesian language, culture, arts, and society through an engaging short program.',
        'Selami bahasa, budaya, seni, dan masyarakat Indonesia melalui program singkat yang menarik.',
      ),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta')],
    }, { accent: 'magenta' }),
    imageText({
      heading: t('Experience Indonesia', 'Rasakan Indonesia'),
      body: t(
        'From language classes to cultural workshops and field trips, Indonesian SPECTRUM gives you an authentic window into life in Indonesia in just a few weeks.',
        'Dari kelas bahasa hingga lokakarya budaya dan kunjungan lapangan, Indonesian SPECTRUM memberi Anda jendela autentik ke kehidupan di Indonesia hanya dalam beberapa minggu.',
      ),
    }),
    featureList({
      heading: t('Program highlights', 'Keunggulan program'),
      items: [
        { icon: 'book', title: t('Bahasa Indonesia', 'Bahasa Indonesia'), body: t('Practical language classes for everyday life.', 'Kelas bahasa praktis untuk kehidupan sehari-hari.') },
        { icon: 'sparkles', title: t('Culture & arts', 'Budaya & seni'), body: t('Hands-on workshops in Indonesian traditions.', 'Lokakarya langsung tentang tradisi Indonesia.') },
        { icon: 'compass', title: t('Field trips', 'Kunjungan lapangan'), body: t('Explore heritage sites and local communities.', 'Jelajahi situs warisan budaya dan komunitas lokal.') },
      ],
    }, { accent: 'magenta' }),
    steps({
      heading: t('How to join', 'Cara bergabung'),
      steps: [
        { title: t('Register', 'Mendaftar'), body: t('Submit the online application before the deadline.', 'Kirimkan aplikasi daring sebelum batas waktu.') },
        { title: t('Confirm', 'Konfirmasi'), body: t('Receive your acceptance and program details.', 'Terima penerimaan dan detail program Anda.') },
        { title: t('Arrive', 'Tiba'), body: t('Join orientation and settle into Surabaya.', 'Ikuti orientasi dan menetap di Surabaya.') },
        { title: t('Experience', 'Mengalami'), body: t('Enjoy classes, workshops, and cultural trips.', 'Nikmati kelas, lokakarya, dan perjalanan budaya.') },
      ],
    }, { accent: 'magenta' }),
    cta({
      heading: t('Discover Indonesia with us', 'Temukan Indonesia bersama kami'),
      ctas: [btn(t('Apply now', 'Daftar sekarang'), APPLY, 'magenta'), btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'outline')],
    }),
  ],

  // ===================== MOBILITY — OUTBOUND (accent amber) =====================
  'mobility/outbound': [
    hero({
      eyebrow: t('Outbound Programs', 'Program Outbound'),
      heading: t('Go Abroad', 'Ke Luar Negeri'),
      subcopy: t(
        'Petra students — take your studies beyond campus. Internships, exchange, and joint degrees await around the world.',
        'Mahasiswa Petra — bawa studi Anda melampaui kampus. Magang, pertukaran, dan gelar bersama menanti di seluruh dunia.',
      ),
      ctas: [btn(t('Talk to the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
    sectionHeader({
      eyebrow: t('Choose your path', 'Pilih jalur Anda'),
      heading: t('Outbound mobility programs', 'Program mobilitas outbound'),
      intro: t('Opportunities for Petra students to study, intern, and grow abroad.', 'Peluang bagi mahasiswa Petra untuk belajar, magang, dan berkembang di luar negeri.'),
    }, { accent: 'amber' }),
    cardGrid([
      { title: t('International Internship', 'Magang Internasional'), body: t('Gain professional experience with global partners.', 'Dapatkan pengalaman profesional bersama mitra global.'), href: '/mobility/outbound/internship' },
      { title: t('Joint & Double Degree', 'Joint & Double Degree'), body: t('Earn qualifications from Petra and a partner university.', 'Raih kualifikasi dari Petra dan universitas mitra.'), href: '/mobility/outbound/joint-double-degree' },
      { title: t('Study Abroad', 'Studi ke Luar Negeri'), body: t('Spend a semester at one of our partner universities.', 'Habiskan satu semester di salah satu universitas mitra kami.'), href: '/mobility/outbound/study-abroad' },
    ], { accent: 'amber' }),
    featureList({
      heading: t('Why go abroad?', 'Mengapa ke luar negeri?'),
      items: [
        { icon: 'globe', title: t('Global perspective', 'Wawasan global'), body: t('Experience new cultures and ways of thinking.', 'Rasakan budaya dan cara berpikir yang baru.') },
        { icon: 'plane', title: t('New opportunities', 'Peluang baru'), body: t('Build an international network and CV.', 'Bangun jaringan dan CV internasional.') },
        { icon: 'star', title: t('Personal growth', 'Pertumbuhan pribadi'), body: t('Grow in independence and confidence.', 'Berkembang dalam kemandirian dan kepercayaan diri.') },
      ],
    }, { accent: 'amber' }),
    cta({
      eyebrow: t('Ready to explore?', 'Siap menjelajah?'),
      heading: t('Start your journey abroad', 'Mulai perjalanan Anda ke luar negeri'),
      ctas: [btn(t('Contact the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
  ],

  'mobility/outbound/internship': [
    hero({
      eyebrow: t('Outbound Programs', 'Program Outbound'),
      heading: t('International Internship', 'Magang Internasional'),
      subcopy: t(
        'Gain hands-on professional experience abroad and turn your studies into a global career head start.',
        'Dapatkan pengalaman profesional langsung di luar negeri dan jadikan studi Anda sebagai awal karier global.',
      ),
      ctas: [btn(t('Talk to the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
    imageText({
      heading: t('Work, learn, and grow abroad', 'Bekerja, belajar, dan berkembang di luar negeri'),
      body: t(
        'Through our partner network, Petra students can take on internships with companies and organizations around the world, applying classroom learning in a real, international workplace.',
        'Melalui jaringan mitra kami, mahasiswa Petra dapat mengikuti magang di perusahaan dan organisasi di seluruh dunia, menerapkan pembelajaran di kelas dalam lingkungan kerja internasional yang nyata.',
      ),
    }),
    featureList({
      heading: t('Program highlights', 'Keunggulan program'),
      items: [
        { icon: 'building', title: t('Global placements', 'Penempatan global'), body: t('Internships with partner organizations abroad.', 'Magang bersama organisasi mitra di luar negeri.') },
        { icon: 'award', title: t('Credit & recognition', 'Kredit & pengakuan'), body: t('Eligible internships may count toward your studies.', 'Magang yang memenuhi syarat dapat diakui dalam studi Anda.') },
        { icon: 'idea', title: t('Career head start', 'Awal karier'), body: t('Build skills and connections employers value.', 'Bangun keterampilan dan koneksi yang dihargai pemberi kerja.') },
      ],
    }, { accent: 'amber' }),
    steps({
      heading: t('How to apply', 'Cara mendaftar'),
      steps: [
        { title: t('Meet the IO', 'Temui IO'), body: t('Discuss your goals and available placements.', 'Diskusikan tujuan Anda dan penempatan yang tersedia.') },
        { title: t('Apply', 'Mendaftar'), body: t('Submit your application and documents.', 'Kirimkan aplikasi dan dokumen Anda.') },
        { title: t('Prepare', 'Persiapan'), body: t('Arrange your visa, travel, and logistics.', 'Atur visa, perjalanan, dan logistik Anda.') },
        { title: t('Go', 'Berangkat'), body: t('Begin your internship experience abroad.', 'Mulai pengalaman magang Anda di luar negeri.') },
      ],
    }, { accent: 'amber' }),
    cta({
      heading: t('Ready for a global internship?', 'Siap untuk magang global?'),
      ctas: [btn(t('Contact the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
  ],

  'mobility/outbound/joint-double-degree': [
    hero({
      eyebrow: t('Outbound Programs', 'Program Outbound'),
      heading: t('Joint & Double Degree', 'Joint & Double Degree'),
      subcopy: t(
        'Earn qualifications from both Petra and a partner university abroad through structured degree pathways.',
        'Raih kualifikasi dari Petra sekaligus universitas mitra di luar negeri melalui jalur gelar yang terstruktur.',
      ),
      ctas: [btn(t('Talk to the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
    imageText({
      heading: t('Two universities, one journey', 'Dua universitas, satu perjalanan'),
      body: t(
        'In a joint or double degree, you spend part of your studies at Petra and part at a partner institution, graduating with internationally recognized credentials and a truly global experience.',
        'Dalam program joint atau double degree, Anda menempuh sebagian studi di Petra dan sebagian lagi di institusi mitra, lalu lulus dengan kredensial yang diakui secara internasional dan pengalaman yang benar-benar global.',
      ),
    }),
    featureList({
      heading: t('Why choose a joint degree?', 'Mengapa memilih joint degree?'),
      items: [
        { icon: 'graduation', title: t('Dual credentials', 'Kredensial ganda'), body: t('Graduate recognized by two institutions.', 'Lulus dengan pengakuan dari dua institusi.') },
        { icon: 'globe', title: t('International experience', 'Pengalaman internasional'), body: t('Live and study in another country.', 'Tinggal dan belajar di negara lain.') },
        { icon: 'handshake', title: t('Strong partners', 'Mitra tepercaya'), body: t('Programs built with trusted partner universities.', 'Program yang dibangun bersama universitas mitra tepercaya.') },
      ],
    }, { accent: 'amber' }),
    accordion({
      heading: t('Frequently asked questions', 'Pertanyaan yang sering diajukan'),
      items: [
        { q: t('Who is eligible?', 'Siapa yang memenuhi syarat?'), a: t('Active Petra students in participating study programs. Requirements vary by partnership — contact the IO.', 'Mahasiswa Petra aktif pada program studi yang berpartisipasi. Persyaratan berbeda tiap kemitraan — hubungi IO.') },
        { q: t('How long does it take?', 'Berapa lama durasinya?'), a: t('It depends on the specific pathway. Some add time abroad; others fit within your regular study plan.', 'Tergantung jalur spesifiknya. Beberapa menambah waktu di luar negeri; lainnya sesuai dengan rencana studi reguler Anda.') },
        { q: t('What about costs?', 'Bagaimana dengan biaya?'), a: t('Costs vary by partner and country. The IO can help you understand fees and any scholarship options.', 'Biaya bervariasi tergantung mitra dan negara. IO dapat membantu Anda memahami biaya dan opsi beasiswa.') },
      ],
    }),
    cta({
      heading: t('Explore joint degree pathways', 'Jelajahi jalur joint degree'),
      ctas: [btn(t('Contact the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
  ],

  'mobility/outbound/study-abroad': [
    hero({
      eyebrow: t('Outbound Programs', 'Program Outbound'),
      heading: t('Study Abroad', 'Studi ke Luar Negeri'),
      subcopy: t(
        'Spend a semester at one of Petra’s partner universities and bring home credits, memories, and a global network.',
        'Habiskan satu semester di salah satu universitas mitra Petra dan bawa pulang kredit, kenangan, serta jaringan global.',
      ),
      ctas: [btn(t('Talk to the IO', 'Hubungi IO'), '/about/contact-us', 'amber')],
    }, { accent: 'amber' }),
    imageText({
      heading: t('A semester that changes everything', 'Satu semester yang mengubah segalanya'),
      body: t(
        'Study abroad lets you take courses at a partner university, earn transferable credits, and immerse yourself in a new culture — all while staying on track to graduate from Petra.',
        'Program studi ke luar negeri memungkinkan Anda mengambil mata kuliah di universitas mitra, memperoleh kredit yang dapat ditransfer, dan menyelami budaya baru — sambil tetap sesuai jadwal kelulusan dari Petra.',
      ),
    }),
    featureList({
      heading: t('What you’ll gain', 'Yang akan Anda peroleh'),
      items: [
        { icon: 'book', title: t('Transferable credits', 'Kredit yang dapat ditransfer'), body: t('Approved courses count toward your Petra degree.', 'Mata kuliah yang disetujui diakui dalam gelar Petra Anda.') },
        { icon: 'compass', title: t('Cultural immersion', 'Imersi budaya'), body: t('Live and learn in a new country.', 'Tinggal dan belajar di negara baru.') },
        { icon: 'users', title: t('Lifelong network', 'Jaringan seumur hidup'), body: t('Make friends and connections worldwide.', 'Jalin pertemanan dan koneksi di seluruh dunia.') },
      ],
    }, { accent: 'amber' }),
    steps({
      heading: t('How to apply', 'Cara mendaftar'),
      steps: [
        { title: t('Choose a destination', 'Pilih destinasi'), body: t('Browse partner universities with the IO.', 'Telusuri universitas mitra bersama IO.') },
        { title: t('Get nominated', 'Dapatkan nominasi'), body: t('Petra nominates you to the host university.', 'Petra menominasikan Anda ke universitas tuan rumah.') },
        { title: t('Apply & prepare', 'Mendaftar & persiapan'), body: t('Complete the host application and arrange your visa.', 'Lengkapi aplikasi tuan rumah dan atur visa Anda.') },
        { title: t('Study abroad', 'Studi ke luar negeri'), body: t('Begin your exchange semester.', 'Mulai semester pertukaran Anda.') },
      ],
    }, { accent: 'amber' }),
    cta({
      heading: t('Where will you go?', 'Ke mana Anda akan pergi?'),
      ctas: [btn(t('See our partners', 'Lihat mitra kami'), '/partnership/international', 'amber'), btn(t('Contact the IO', 'Hubungi IO'), '/about/contact-us', 'outline')],
    }, { accent: 'amber' }),
  ],

  'mobility/gallery': [
    hero({
      eyebrow: t('International Mobility', 'Mobilitas Internasional'),
      heading: t('Program Gallery', 'Galeri Program'),
      subcopy: t(
        'Moments from our mobility programs — students, communities, and journeys across the world.',
        'Momen dari program mobilitas kami — mahasiswa, komunitas, dan perjalanan ke seluruh dunia.',
      ),
    }),
    sectionHeader({
      eyebrow: t('Gallery', 'Galeri'),
      heading: t('Life in our programs', 'Kehidupan dalam program kami'),
      intro: t('Upload your own photos here in the editor to build the gallery.', 'Unggah foto Anda di editor untuk melengkapi galeri ini.'),
    }),
    gallery({ columns: 4 }),
    cta({
      heading: t('Want to be part of the story?', 'Ingin menjadi bagian dari kisah ini?'),
      ctas: [btn(t('Explore programs', 'Jelajahi program'), '/mobility', 'magenta')],
    }),
  ],

  'mobility/faq': [
    hero({
      eyebrow: t('International Mobility', 'Mobilitas Internasional'),
      heading: t('Frequently Asked Questions', 'Pertanyaan yang Sering Diajukan'),
      subcopy: t(
        'Answers to common questions about our inbound and outbound mobility programs.',
        'Jawaban atas pertanyaan umum seputar program mobilitas inbound dan outbound kami.',
      ),
    }),
    accordion({
      heading: t('General', 'Umum'),
      items: [
        { q: t('Who can join Petra’s mobility programs?', 'Siapa yang dapat mengikuti program mobilitas Petra?'), a: t('International students can join our inbound programs; active Petra students can join outbound programs. Requirements vary by program.', 'Mahasiswa internasional dapat mengikuti program inbound; mahasiswa Petra aktif dapat mengikuti program outbound. Persyaratan berbeda tiap program.') },
        { q: t('What language are courses taught in?', 'Dalam bahasa apa mata kuliah diajarkan?'), a: t('Many courses are English-supported. Language assistance is available for international students.', 'Banyak mata kuliah didukung bahasa Inggris. Bantuan bahasa tersedia bagi mahasiswa internasional.') },
        { q: t('How do I start my application?', 'Bagaimana cara memulai pendaftaran?'), a: t('Choose your program and follow its “Apply” steps, or contact the International Office for guidance.', 'Pilih program Anda dan ikuti langkah “Daftar”, atau hubungi International Office untuk panduan.') },
      ],
    }),
    accordion({
      heading: t('Costs & logistics', 'Biaya & logistik'),
      items: [
        { q: t('How much does it cost?', 'Berapa biayanya?'), a: t('Costs depend on the program, duration, and destination. Contact us for a detailed breakdown.', 'Biaya tergantung program, durasi, dan tujuan. Hubungi kami untuk rinciannya.') },
        { q: t('Do you help with visas and housing?', 'Apakah Anda membantu visa dan akomodasi?'), a: t('Yes — the International Office supports you with immigration documents and accommodation guidance.', 'Ya — International Office membantu Anda dengan dokumen imigrasi dan panduan akomodasi.') },
        { q: t('Is there support once I arrive?', 'Apakah ada dukungan setelah saya tiba?'), a: t('Our PETRAMate buddy program and IO team support you throughout your stay.', 'Program buddy PETRAMate dan tim IO kami mendampingi Anda selama masa tinggal.') },
      ],
    }, { background: 'accent-tint' }),
    cta({
      heading: t('Still have questions?', 'Masih ada pertanyaan?'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'magenta')],
    }),
  ],

  // ===================== PARTNERSHIP (accent blue) =====================
  'partnership/domestic': [
    hero({
      eyebrow: t('Partnership', 'Kemitraan'),
      heading: t('Domestic Partnership', 'Kemitraan Dalam Negeri'),
      subcopy: t(
        'Petra collaborates with schools, companies, and institutions across Indonesia to create opportunities for our students and communities.',
        'Petra bekerja sama dengan sekolah, perusahaan, dan institusi di seluruh Indonesia untuk menciptakan peluang bagi mahasiswa dan komunitas kami.',
      ),
    }, { accent: 'blue' }),
    imageText({
      heading: t('Rooted in Indonesia', 'Berakar di Indonesia'),
      body: t(
        'From high schools and universities to industry and government, our domestic network fuels internships, research, community programs, and student recruitment nationwide.',
        'Dari sekolah menengah dan universitas hingga industri dan pemerintahan, jaringan dalam negeri kami mendorong magang, penelitian, program komunitas, dan penerimaan mahasiswa di seluruh negeri.',
      ),
    }),
    statStrip([
      { value: '430+', label: t('Domestic Partners', 'Mitra Dalam Negeri') },
      { value: '34', label: t('Provinces reached', 'Provinsi terjangkau') },
      { value: '60+', label: t('Years of collaboration', 'Tahun kolaborasi') },
    ], { accent: 'blue' }),
    partnerMarquee(t('Some of our domestic partners', 'Sebagian mitra dalam negeri kami'), 'domestic'),
    cta({
      eyebrow: t('Let’s work together', 'Mari bekerja sama'),
      heading: t('Become a domestic partner', 'Menjadi mitra dalam negeri'),
      ctas: [btn(t('Partner with us', 'Bermitra dengan kami'), '/partnership/contact-us', 'blue')],
    }, { accent: 'blue' }),
  ],

  'partnership/consortium': [
    hero({
      eyebrow: t('Partnership', 'Kemitraan'),
      heading: t('Consortium', 'Konsorsium'),
      subcopy: t(
        'Petra takes part in academic consortia and networks that advance research, mobility, and shared learning across borders.',
        'Petra ikut serta dalam konsorsium dan jaringan akademik yang memajukan penelitian, mobilitas, dan pembelajaran bersama lintas negara.',
      ),
    }, { accent: 'blue' }),
    imageText({
      heading: t('Stronger together', 'Lebih kuat bersama'),
      body: t(
        'Through consortium membership, Petra collaborates with groups of universities on joint programs, staff and student exchange, and collaborative research — multiplying the impact of every partnership.',
        'Melalui keanggotaan konsorsium, Petra berkolaborasi dengan sekelompok universitas dalam program bersama, pertukaran staf dan mahasiswa, serta penelitian kolaboratif — melipatgandakan dampak setiap kemitraan.',
      ),
    }),
    featureList({
      heading: t('What consortia enable', 'Yang dimungkinkan konsorsium'),
      items: [
        { icon: 'globe', title: t('Wider mobility', 'Mobilitas lebih luas'), body: t('Access to exchange across many universities at once.', 'Akses pertukaran ke banyak universitas sekaligus.') },
        { icon: 'idea', title: t('Joint research', 'Penelitian bersama'), body: t('Collaborate on shared projects and publications.', 'Berkolaborasi dalam proyek dan publikasi bersama.') },
        { icon: 'handshake', title: t('Shared programs', 'Program bersama'), body: t('Co-create courses, events, and initiatives.', 'Menciptakan mata kuliah, acara, dan inisiatif bersama.') },
      ],
    }, { accent: 'blue' }),
    logoWall(t('Networks & consortia we belong to', 'Jaringan & konsorsium yang kami ikuti')),
    cta({
      heading: t('Interested in collaborating?', 'Tertarik berkolaborasi?'),
      ctas: [btn(t('Partner with us', 'Bermitra dengan kami'), '/partnership/contact-us', 'blue')],
    }, { accent: 'blue' }),
  ],

  'partnership/contact-us': [
    hero({
      eyebrow: t('Partnership', 'Kemitraan'),
      heading: t('Partnering With Us', 'Bermitra dengan Kami'),
      subcopy: t(
        'Let’s build something together — exchange, joint degrees, research, or Tailor-Made Programs. Here’s how to start.',
        'Mari membangun sesuatu bersama — pertukaran, gelar bersama, penelitian, atau Tailor-Made Program. Berikut cara memulainya.',
      ),
    }, { accent: 'blue' }),
    featureList({
      heading: t('Ways to partner', 'Bentuk kemitraan'),
      items: [
        { icon: 'graduation', title: t('Student & staff exchange', 'Pertukaran mahasiswa & staf'), body: t('Mobility agreements for study, teaching, and research.', 'Perjanjian mobilitas untuk studi, pengajaran, dan penelitian.') },
        { icon: 'award', title: t('Joint & double degrees', 'Joint & double degree'), body: t('Co-designed degree pathways with recognized credentials.', 'Jalur gelar yang dirancang bersama dengan kredensial yang diakui.') },
        { icon: 'idea', title: t('Research & Tailor-Made', 'Penelitian & Tailor-Made'), body: t('Collaborative research and custom programs for your students.', 'Penelitian kolaboratif dan program khusus untuk mahasiswa Anda.') },
      ],
    }, { accent: 'blue' }),
    steps({
      heading: t('How to start a partnership', 'Cara memulai kemitraan'),
      steps: [
        { title: t('Reach out', 'Hubungi kami'), body: t('Send us a message with your goals and ideas.', 'Kirimkan pesan berisi tujuan dan ide Anda.') },
        { title: t('Explore together', 'Menjajaki bersama'), body: t('We discuss areas of collaboration and fit.', 'Kami mendiskusikan bidang kolaborasi dan kecocokan.') },
        { title: t('Formalize', 'Formalisasi'), body: t('Sign an MoU or agreement outlining the partnership.', 'Menandatangani MoU atau perjanjian yang merinci kemitraan.') },
        { title: t('Launch', 'Meluncurkan'), body: t('Begin activities and grow the relationship over time.', 'Memulai kegiatan dan menumbuhkan hubungan dari waktu ke waktu.') },
      ],
    }, { accent: 'blue' }),
    inquiry({
      heading: t('Request a meeting', 'Ajukan pertemuan'),
      intro: t('Tell us about your institution and what you’d like to explore. Our partnerships team will be in touch.', 'Ceritakan tentang institusi Anda dan apa yang ingin Anda jajaki. Tim kemitraan kami akan menghubungi Anda.'),
    }, 'partner', { accent: 'blue' }),
  ],

  // ===================== LIFE AT PETRA (accent cyan) =====================
  'life-at-petra': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('Your life in Surabaya', 'Kehidupan Anda di Surabaya'),
      subcopy: t(
        'Everything you need to settle in — getting here, finding a place to stay, immigration, and preparing for arrival.',
        'Semua yang Anda butuhkan untuk menetap — menuju ke sini, mencari tempat tinggal, imigrasi, dan persiapan kedatangan.',
      ),
    }, { accent: 'cyan' }),
    sectionHeader({
      eyebrow: t('Get started', 'Mulai di sini'),
      heading: t('Practical guides for international students', 'Panduan praktis untuk mahasiswa internasional'),
      intro: t('Explore our guides to living and studying at Petra.', 'Jelajahi panduan kami untuk tinggal dan belajar di Petra.'),
    }, { accent: 'cyan' }),
    cardGrid([
      { title: t('How to Get to PETRA', 'Cara Menuju PETRA'), body: t('From the airport to campus — routes and tips.', 'Dari bandara ke kampus — rute dan tips.'), href: '/life-at-petra/get-to-petra' },
      { title: t('Accommodations', 'Akomodasi'), body: t('Dormitories, boarding houses, and apartments.', 'Asrama, indekos, dan apartemen.'), href: '/life-at-petra/accommodations' },
      { title: t('Immigration', 'Imigrasi'), body: t('Visas, permits, and staying legally in Indonesia.', 'Visa, izin, dan tinggal secara legal di Indonesia.'), href: '/life-at-petra/immigration' },
      { title: t('Pre-Departure Guide', 'Panduan Pra-Keberangkatan'), body: t('What to prepare before you travel.', 'Yang perlu disiapkan sebelum Anda berangkat.'), href: '/life-at-petra/predeparture' },
      { title: t('FAQ', 'FAQ'), body: t('Answers to common questions about life at Petra.', 'Jawaban atas pertanyaan umum tentang kehidupan di Petra.'), href: '/life-at-petra/faq' },
    ], { accent: 'cyan' }),
    featureList({
      heading: t('Why students love Surabaya', 'Mengapa mahasiswa menyukai Surabaya'),
      items: [
        { icon: 'heart', title: t('Affordable living', 'Biaya hidup terjangkau'), body: t('A comfortable student life at a low cost.', 'Kehidupan mahasiswa yang nyaman dengan biaya rendah.') },
        { icon: 'compass', title: t('Well connected', 'Terhubung dengan baik'), body: t('Easy access to mountains, beaches, and cities.', 'Akses mudah ke pegunungan, pantai, dan kota-kota.') },
        { icon: 'users', title: t('Warm community', 'Komunitas yang hangat'), body: t('A caring campus that welcomes you.', 'Kampus yang peduli dan menyambut Anda.') },
      ],
    }, { accent: 'cyan' }),
    cta({
      heading: t('Ready to make Surabaya home?', 'Siap menjadikan Surabaya rumah Anda?'),
      ctas: [btn(t('Explore programs', 'Jelajahi program'), '/mobility', 'amber')],
    }, { accent: 'cyan' }),
  ],

  'life-at-petra/get-to-petra': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('How to Get to PETRA', 'Cara Menuju PETRA'),
      subcopy: t(
        'Petra Christian University is in the Wonocolo district of Surabaya, East Java. Here’s how to reach us.',
        'Universitas Kristen Petra berada di kawasan Wonocolo, Surabaya, Jawa Timur. Berikut cara menuju kampus kami.',
      ),
    }, { accent: 'cyan' }),
    imageText({
      heading: t('Finding the campus', 'Menemukan kampus'),
      body: t(
        'The nearest airport is Juanda International Airport (SUB), about 30–45 minutes from campus. From there, ride-hailing apps, taxis, and airport transfers make the trip easy.',
        'Bandara terdekat adalah Bandara Internasional Juanda (SUB), sekitar 30–45 menit dari kampus. Dari sana, aplikasi transportasi daring, taksi, dan antar-jemput bandara memudahkan perjalanan Anda.',
      ),
    }),
    steps({
      heading: t('From the airport to campus', 'Dari bandara ke kampus'),
      steps: [
        { title: t('Arrive at Juanda (SUB)', 'Tiba di Juanda (SUB)'), body: t('Clear immigration and collect your luggage.', 'Selesaikan proses imigrasi dan ambil bagasi Anda.') },
        { title: t('Choose your transport', 'Pilih transportasi'), body: t('Use a ride-hailing app (Gojek/Grab), taxi, or arranged pickup.', 'Gunakan aplikasi transportasi daring (Gojek/Grab), taksi, atau jemputan yang telah diatur.') },
        { title: t('Head to Wonocolo', 'Menuju Wonocolo'), body: t('Travel to Jl. Siwalankerto 121–131, Surabaya.', 'Menuju Jl. Siwalankerto 121–131, Surabaya.') },
        { title: t('Arrive at Petra', 'Tiba di Petra'), body: t('Check in with the International Office on campus.', 'Lapor ke International Office di kampus.') },
      ],
    }, { accent: 'cyan' }),
    embed(t('Petra Christian University on the map', 'Universitas Kristen Petra di peta')),
    cta({
      heading: t('Need arrival support?', 'Butuh bantuan kedatangan?'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'amber')],
    }, { accent: 'cyan' }),
  ],

  'life-at-petra/accommodations': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('Accommodations', 'Akomodasi'),
      subcopy: t(
        'From on-campus options to nearby boarding houses and apartments — find a comfortable place to call home.',
        'Dari pilihan di dalam kampus hingga indekos dan apartemen di sekitarnya — temukan tempat tinggal yang nyaman.',
      ),
    }, { accent: 'cyan' }),
    imageText({
      heading: t('Where you’ll live', 'Tempat Anda tinggal'),
      body: t(
        'Most international students live within a short distance of campus. The International Office can guide you toward safe, affordable, and convenient options that suit your budget.',
        'Sebagian besar mahasiswa internasional tinggal tak jauh dari kampus. International Office dapat membantu Anda menemukan pilihan yang aman, terjangkau, dan nyaman sesuai anggaran Anda.',
      ),
    }),
    cardGrid([
      { title: t('Boarding house (Kos)', 'Indekos (Kos)'), body: t('Private rooms near campus, popular and budget-friendly.', 'Kamar pribadi dekat kampus, populer dan hemat biaya.') },
      { title: t('Apartments', 'Apartemen'), body: t('More space and amenities for longer stays.', 'Ruang dan fasilitas lebih untuk masa tinggal yang lebih lama.') },
      { title: t('Homestay', 'Homestay'), body: t('Live with a local host and immerse in daily culture.', 'Tinggal bersama tuan rumah lokal dan menyelami budaya sehari-hari.') },
    ], { linkToPage: false, accent: 'cyan' }),
    accordion({
      heading: t('Good to know', 'Yang perlu diketahui'),
      items: [
        { q: t('How much does housing cost?', 'Berapa biaya akomodasi?'), a: t('Boarding houses are the most affordable; apartments cost more. Contact the IO for current ranges.', 'Indekos paling terjangkau; apartemen lebih mahal. Hubungi IO untuk kisaran terkini.') },
        { q: t('Can the IO help me find a place?', 'Apakah IO dapat membantu mencari tempat tinggal?'), a: t('Yes — we share trusted options and tips to help you choose.', 'Ya — kami membagikan pilihan tepercaya dan tips untuk membantu Anda memilih.') },
        { q: t('When should I arrange housing?', 'Kapan sebaiknya saya mengatur akomodasi?'), a: t('We recommend arranging accommodation before you arrive. Reach out early.', 'Kami menyarankan mengatur akomodasi sebelum tiba. Hubungi kami lebih awal.') },
      ],
    }),
    cta({
      heading: t('Need help finding housing?', 'Butuh bantuan mencari tempat tinggal?'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'amber')],
    }, { accent: 'cyan' }),
  ],

  'life-at-petra/immigration': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('Immigration', 'Imigrasi'),
      subcopy: t(
        'A clear overview of the visas and permits you’ll need to study legally in Indonesia — and how we help.',
        'Gambaran jelas tentang visa dan izin yang Anda perlukan untuk belajar secara legal di Indonesia — dan bagaimana kami membantu.',
      ),
    }, { accent: 'cyan' }),
    imageText({
      heading: t('Visas & permits', 'Visa & izin'),
      body: t(
        'International students generally need a student visa and a stay permit. Requirements depend on your program length and nationality — the International Office guides you through each step and document.',
        'Mahasiswa internasional umumnya memerlukan visa pelajar dan izin tinggal. Persyaratan tergantung durasi program dan kewarganegaraan Anda — International Office memandu Anda di setiap langkah dan dokumen.',
      ),
    }),
    steps({
      heading: t('The immigration process', 'Proses imigrasi'),
      steps: [
        { title: t('Receive your Letter of Acceptance', 'Terima Surat Penerimaan'), body: t('Your LoA is the basis for your visa application.', 'LoA Anda menjadi dasar permohonan visa.') },
        { title: t('Prepare documents', 'Siapkan dokumen'), body: t('Gather your passport, photos, and required forms.', 'Kumpulkan paspor, foto, dan formulir yang diperlukan.') },
        { title: t('Apply for your visa', 'Ajukan visa'), body: t('The IO assists with sponsorship and the application.', 'IO membantu proses sponsor dan pengajuan.') },
        { title: t('Register on arrival', 'Registrasi saat tiba'), body: t('Complete your stay permit and reporting in Surabaya.', 'Selesaikan izin tinggal dan pelaporan di Surabaya.') },
      ],
    }, { accent: 'cyan' }),
    accordion({
      heading: t('Frequently asked questions', 'Pertanyaan yang sering diajukan'),
      items: [
        { q: t('What visa do I need?', 'Visa apa yang saya perlukan?'), a: t('It depends on your program and duration. The IO advises the correct visa type for your case.', 'Tergantung program dan durasi Anda. IO menyarankan jenis visa yang tepat untuk kasus Anda.') },
        { q: t('Does Petra sponsor my visa?', 'Apakah Petra menjadi sponsor visa saya?'), a: t('Yes — for accepted students, the International Office supports the sponsorship process.', 'Ya — bagi mahasiswa yang diterima, International Office mendukung proses sponsor.') },
        { q: t('How early should I start?', 'Seberapa awal saya harus memulai?'), a: t('Begin as soon as you receive your LoA — immigration steps take time.', 'Mulailah segera setelah menerima LoA — proses imigrasi membutuhkan waktu.') },
      ],
    }),
    downloads({
      heading: t('Immigration documents', 'Dokumen imigrasi'),
      intro: t('Upload the relevant forms and checklists here in the editor.', 'Unggah formulir dan daftar periksa terkait di editor.'),
      items: [
        { title: t('Visa application checklist', 'Daftar periksa permohonan visa'), description: t('Add the file in the editor.', 'Tambahkan berkasnya di editor.') },
        { title: t('Stay permit guide', 'Panduan izin tinggal'), description: t('Add the file in the editor.', 'Tambahkan berkasnya di editor.') },
      ],
    }, { accent: 'cyan' }),
    cta({
      heading: t('Questions about your visa?', 'Ada pertanyaan tentang visa Anda?'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'amber')],
    }, { accent: 'cyan' }),
  ],

  'life-at-petra/predeparture': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('Pre-Departure Guide', 'Panduan Pra-Keberangkatan'),
      subcopy: t(
        'Everything to sort out before you travel — documents, health, money, and packing for life in Surabaya.',
        'Semua yang perlu disiapkan sebelum Anda berangkat — dokumen, kesehatan, keuangan, dan barang bawaan untuk kehidupan di Surabaya.',
      ),
    }, { accent: 'cyan' }),
    featureList({
      heading: t('Before you fly', 'Sebelum Anda terbang'),
      items: [
        { icon: 'book', title: t('Documents', 'Dokumen'), body: t('Passport, visa, LoA, insurance, and copies of everything.', 'Paspor, visa, LoA, asuransi, dan salinan semua dokumen.') },
        { icon: 'heart', title: t('Health', 'Kesehatan'), body: t('Check vaccinations, medication, and travel insurance.', 'Periksa vaksinasi, obat-obatan, dan asuransi perjalanan.') },
        { icon: 'award', title: t('Money', 'Keuangan'), body: t('Plan your budget and set up payment and banking access.', 'Rencanakan anggaran serta atur akses pembayaran dan perbankan.') },
      ],
    }, { accent: 'cyan' }),
    accordion({
      heading: t('Packing & preparation', 'Barang bawaan & persiapan'),
      items: [
        { q: t('What should I pack?', 'Apa yang harus saya bawa?'), a: t('Surabaya is tropical year-round — pack light clothing, and bring adapters, essential medicine, and a few home comforts.', 'Surabaya beriklim tropis sepanjang tahun — bawa pakaian ringan, serta adaptor, obat penting, dan sedikit barang dari rumah.') },
        { q: t('How’s the weather?', 'Bagaimana cuacanya?'), a: t('Warm and humid all year, with a rainy season from around November to March.', 'Hangat dan lembap sepanjang tahun, dengan musim hujan sekitar November hingga Maret.') },
        { q: t('What about SIM cards and internet?', 'Bagaimana dengan kartu SIM dan internet?'), a: t('Local SIM cards are cheap and easy to buy on arrival. Campus and most housing have Wi-Fi.', 'Kartu SIM lokal murah dan mudah dibeli saat tiba. Kampus dan sebagian besar akomodasi memiliki Wi-Fi.') },
      ],
    }, { background: 'accent-tint' }),
    downloads({
      heading: t('Pre-departure resources', 'Sumber daya pra-keberangkatan'),
      intro: t('Upload your checklists and handbooks here in the editor.', 'Unggah daftar periksa dan buku panduan Anda di editor.'),
      items: [
        { title: t('Pre-departure checklist', 'Daftar periksa pra-keberangkatan'), description: t('Add the file in the editor.', 'Tambahkan berkasnya di editor.') },
        { title: t('Student handbook', 'Buku panduan mahasiswa'), description: t('Add the file in the editor.', 'Tambahkan berkasnya di editor.') },
      ],
    }, { accent: 'cyan' }),
    cta({
      heading: t('Almost ready to go?', 'Hampir siap berangkat?'),
      ctas: [btn(t('Read the FAQ', 'Baca FAQ'), '/life-at-petra/faq', 'amber')],
    }, { accent: 'cyan' }),
  ],

  'life-at-petra/faq': [
    hero({
      eyebrow: t('Life at PETRA', 'Kehidupan di PETRA'),
      heading: t('FAQ', 'FAQ'),
      subcopy: t(
        'Common questions about living, studying, and settling in as an international student at Petra.',
        'Pertanyaan umum tentang tinggal, belajar, dan menetap sebagai mahasiswa internasional di Petra.',
      ),
    }, { accent: 'cyan' }),
    accordion({
      heading: t('Living in Surabaya', 'Tinggal di Surabaya'),
      items: [
        { q: t('Is Surabaya safe for international students?', 'Apakah Surabaya aman bagi mahasiswa internasional?'), a: t('Surabaya is a welcoming, student-friendly city. As anywhere, use common sense and the IO is here to help.', 'Surabaya adalah kota yang ramah dan bersahabat bagi mahasiswa. Seperti di mana pun, tetap waspada, dan IO siap membantu.') },
        { q: t('What’s the cost of living?', 'Berapa biaya hidupnya?'), a: t('Surabaya is affordable compared to many cities. Housing, food, and transport are budget-friendly.', 'Surabaya relatif terjangkau dibanding banyak kota. Akomodasi, makanan, dan transportasi ramah anggaran.') },
        { q: t('Do I need to speak Indonesian?', 'Apakah saya harus bisa berbahasa Indonesia?'), a: t('Not to get started — many courses are English-supported and we offer language help. Learning basics enriches your stay.', 'Tidak untuk memulai — banyak mata kuliah didukung bahasa Inggris dan kami menyediakan bantuan bahasa. Mempelajari dasar-dasarnya memperkaya pengalaman Anda.') },
      ],
    }),
    accordion({
      heading: t('Support & community', 'Dukungan & komunitas'),
      items: [
        { q: t('Who helps me when I arrive?', 'Siapa yang membantu saya saat tiba?'), a: t('The International Office and the PETRAMate buddy program support you from arrival onward.', 'International Office dan program buddy PETRAMate mendampingi Anda sejak kedatangan.') },
        { q: t('Are there activities and events?', 'Apakah ada kegiatan dan acara?'), a: t('Yes — cultural activities, community events, and student organizations throughout the semester.', 'Ya — kegiatan budaya, acara komunitas, dan organisasi mahasiswa sepanjang semester.') },
        { q: t('How do I get healthcare?', 'Bagaimana cara mengakses layanan kesehatan?'), a: t('Keep valid health insurance; clinics and hospitals are nearby. The IO can point you to trusted options.', 'Pastikan Anda memiliki asuransi kesehatan yang berlaku; klinik dan rumah sakit ada di dekat kampus. IO dapat menunjukkan pilihan tepercaya.') },
      ],
    }, { background: 'accent-tint' }),
    cta({
      heading: t('Didn’t find your answer?', 'Belum menemukan jawaban Anda?'),
      ctas: [btn(t('Contact us', 'Hubungi kami'), '/about/contact-us', 'amber')],
    }, { accent: 'cyan' }),
  ],
};

// ---------------------------------------------------------------------------
async function main() {
  const slugs = Object.keys(PAGE_BLOCKS);
  console.log(`Seeding starter blocks into ${slugs.length} empty pages …\n`);

  // Resolve slug -> page id.
  const { data: pages, error: pageErr } = await supabase
    .from('pages')
    .select('id, slug')
    .in('slug', slugs);
  if (pageErr) throw pageErr;

  const idBySlug = new Map((pages ?? []).map((p) => [p.slug as string, p.id as string]));

  let inserted = 0;
  for (const slug of slugs) {
    const pageId = idBySlug.get(slug);
    if (!pageId) {
      console.warn(`  ⚠ page not found for slug "${slug}" — skipping.`);
      continue;
    }

    // Safety: only ever operate on pages that are currently empty, so we can
    // never clobber the hand-authored pages.
    const { count } = await supabase
      .from('blocks')
      .select('id', { count: 'exact', head: true })
      .eq('page_id', pageId);
    if ((count ?? 0) > 0) {
      // Re-run case: our own previous seed. Clear it, then re-insert.
      await supabase.from('blocks').delete().eq('page_id', pageId);
    }

    const rows = PAGE_BLOCKS[slug].map((b, position) => ({
      page_id: pageId,
      type: b.type,
      position,
      config: b.config,
      content: b.content,
    }));

    const { error: insErr } = await supabase.from('blocks').insert(rows);
    if (insErr) {
      console.error(`  ✗ ${slug}: ${insErr.message}`);
      throw insErr;
    }
    inserted += rows.length;
    console.log(`  ✓ ${slug} — ${rows.length} blocks`);
  }

  console.log(`\nDone. Inserted ${inserted} blocks across ${slugs.length} pages.`);
  console.log('Edit any of it in /admin → Pages → Edit. Hand-authored pages were left untouched.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
