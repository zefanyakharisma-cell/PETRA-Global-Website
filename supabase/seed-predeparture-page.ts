/**
 * Seed the `life-at-petra/predeparture` page (Pre-Departure Guide) with a rich,
 * well-composed set of CMS blocks in English + Indonesian.
 *
 *   npm run db:seed:predeparture
 *
 * Touches only this one page's blocks (delete + re-insert), so re-running yields
 * no duplicates and never affects any other page. Requires
 * SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), read from .env.local.
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

const SLUG = 'life-at-petra/predeparture';

// --- tiny block builders (mirrors supabase/seed-accreditation-page.ts) -------
type L = { en: string; id: string };
const t = (en: string, id: string): L => ({ en, id });
type Block = { type: string; config: Record<string, unknown>; content: Record<string, unknown> };

const hero = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'hero', config: { background: 'navy', spacing: 'spacious', layout: 'centered', bgType: 'aurora', accent: 'blue', ...cfg }, content: { ctas: [], ...content },
});
const sectionHeader = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'section_header', config: { background: 'paper', spacing: 'normal', layout: 'center', alignment: 'center', accent: 'blue', ...cfg }, content,
});
const steps = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'steps', config: { background: 'paper', spacing: 'spacious', orientation: 'vertical', accent: 'blue', ...cfg }, content,
});
const featureList = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'feature_list', config: { background: 'paper', spacing: 'normal', layout: 'cards', columns: 2, accent: 'blue', ...cfg }, content,
});
const richText = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'rich_text', config: { background: 'paper', spacing: 'normal', width: 'two-column', ...cfg }, content,
});
const tabs = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'tabs', config: { background: 'paper', spacing: 'spacious', layout: 'top', accent: 'blue', ...cfg }, content,
});
const cta = (content: Record<string, unknown>, cfg: Record<string, unknown> = {}): Block => ({
  type: 'cta_banner', config: { background: 'navy', spacing: 'normal', alignment: 'center', accent: 'cyan', ...cfg }, content: { ctas: [], ...content },
});

// bilingual HTML richtext helper
const html = (en: string, id: string): L => ({ en, id });

// ---------------------------------------------------------------------------
// The Pre-Departure Guide — ordered blocks.
// ---------------------------------------------------------------------------
function buildBlocks(): Block[] {
  return [
    // 1 — Hero -------------------------------------------------------------
    hero({
      eyebrow: t('International Office', 'Kantor Internasional'),
      heading: t('Prepare for Your Journey to Petra', 'Persiapkan Perjalanan Anda ke Petra'),
      subcopy: t(
        'Congratulations on your admission! We are delighted to welcome you to Surabaya, Indonesia. This guide helps you get ready before you leave home, understand what to expect on arrival, and make your transition to life at Petra as smooth as possible.',
        'Selamat atas penerimaan Anda! Kami dengan senang hati menyambut Anda di Surabaya, Indonesia. Panduan ini membantu Anda bersiap sebelum berangkat, memahami apa yang akan Anda temui saat tiba, dan menjadikan transisi Anda ke kehidupan di Petra selancar mungkin.',
      ),
      ctas: [{ href: '/about/contact-us', label: t('Contact the International Office', 'Hubungi Kantor Internasional'), newTab: false, variant: 'blue' }],
    }),

    // 2 — Before You Leave (header) ---------------------------------------
    sectionHeader({
      eyebrow: t('Before You Leave', 'Sebelum Anda Berangkat'),
      heading: t('Get ready with confidence', 'Bersiaplah dengan percaya diri'),
      intro: t(
        'Moving to a new country is exciting, but it also takes careful preparation. Work through the steps below so you begin your experience without last-minute stress.',
        'Pindah ke negara baru memang menyenangkan, tetapi memerlukan persiapan yang matang. Ikuti langkah-langkah berikut agar Anda memulai pengalaman ini tanpa kepanikan di menit-menit terakhir.',
      ),
    }),

    // 3 — Preparation steps ------------------------------------------------
    steps({
      heading: t('Your pre-departure checklist', 'Daftar persiapan pra-keberangkatan Anda'),
      steps: [
        {
          title: t('Confirm your admission', 'Konfirmasi penerimaan Anda'),
          body: html(
            '<p>Before making travel arrangements, make sure you have:</p><ul><li>Accepted your offer of admission.</li><li>Received your official Letter of Acceptance (LoA).</li><li>Completed all administrative requirements from Petra Christian University.</li><li>Kept in touch with the International Office about your arrival schedule.</li></ul>',
            '<p>Sebelum mengatur perjalanan, pastikan Anda telah:</p><ul><li>Menerima tawaran penerimaan Anda.</li><li>Menerima Letter of Acceptance (LoA) resmi.</li><li>Menyelesaikan seluruh persyaratan administratif dari Universitas Kristen Petra.</li><li>Menjaga komunikasi dengan Kantor Internasional mengenai jadwal kedatangan Anda.</li></ul>',
          ),
        },
        {
          title: t('Apply for your visa', 'Ajukan visa Anda'),
          body: html(
            '<p>International students are responsible for obtaining the appropriate visa before travelling to Indonesia. Before you apply:</p><ul><li>Review the latest Indonesian immigration requirements.</li><li>Prepare all required supporting documents.</li><li>Check your passport validity (at least six months beyond arrival).</li><li>Apply well in advance — processing times vary by country.</li></ul><p>If you need supporting documents from Petra, contact the International Office.</p>',
            '<p>Mahasiswa internasional bertanggung jawab untuk memperoleh visa yang sesuai sebelum bepergian ke Indonesia. Sebelum mengajukan:</p><ul><li>Tinjau persyaratan imigrasi Indonesia terbaru.</li><li>Siapkan seluruh dokumen pendukung yang diperlukan.</li><li>Periksa masa berlaku paspor Anda (minimal enam bulan setelah kedatangan).</li><li>Ajukan jauh-jauh hari — waktu pemrosesan berbeda di setiap negara.</li></ul><p>Jika Anda memerlukan dokumen pendukung dari Petra, hubungi Kantor Internasional.</p>',
          ),
        },
        {
          title: t('Arrange your accommodation', 'Atur akomodasi Anda'),
          body: html(
            '<p>Finding comfortable accommodation before arrival helps you settle in faster. You may choose from:</p><ul><li>Student boarding houses (Kos)</li><li>Apartments</li><li>Private rentals</li><li>Hotels or serviced apartments for temporary stays</li></ul><p>The International Office can recommend options near campus that match your preferences and budget.</p>',
            '<p>Menemukan akomodasi yang nyaman sebelum tiba membantu Anda beradaptasi lebih cepat. Anda dapat memilih dari:</p><ul><li>Rumah kos mahasiswa (Kos)</li><li>Apartemen</li><li>Sewa pribadi</li><li>Hotel atau apartemen berlayanan untuk tinggal sementara</li></ul><p>Kantor Internasional dapat merekomendasikan pilihan dekat kampus yang sesuai dengan preferensi dan anggaran Anda.</p>',
          ),
        },
        {
          title: t('Plan your travel', 'Rencanakan perjalanan Anda'),
          body: html(
            '<p>Once your visa is approved:</p><ul><li>Book your flight to Surabaya.</li><li>Plan to arrive several days before Orientation Week.</li><li>Share your arrival details with the International Office.</li><li>Keep copies of your flight itinerary and travel documents.</li></ul><p>Arriving early gives you time to recover from travel and complete any administrative procedures.</p>',
            '<p>Setelah visa Anda disetujui:</p><ul><li>Pesan penerbangan Anda ke Surabaya.</li><li>Rencanakan untuk tiba beberapa hari sebelum Pekan Orientasi.</li><li>Bagikan detail kedatangan Anda kepada Kantor Internasional.</li><li>Simpan salinan itinerary penerbangan dan dokumen perjalanan Anda.</li></ul><p>Tiba lebih awal memberi Anda waktu untuk beristirahat dan menyelesaikan berbagai prosedur administratif.</p>',
          ),
        },
        {
          title: t('Prepare your budget', 'Siapkan anggaran Anda'),
          body: html(
            '<p>Managing your finances beforehand helps you adapt comfortably during your first weeks. Budget for:</p><ul><li>Accommodation</li><li>Meals</li><li>Transportation</li><li>Mobile phone &amp; internet</li><li>Personal expenses</li><li>Study materials</li><li>Leisure activities</li></ul><p>Many businesses accept international cards, but carrying some Indonesian Rupiah (IDR) for small purchases is recommended.</p>',
            '<p>Mengelola keuangan sejak awal membantu Anda beradaptasi dengan nyaman selama minggu-minggu pertama. Anggarkan untuk:</p><ul><li>Akomodasi</li><li>Makan</li><li>Transportasi</li><li>Ponsel &amp; internet</li><li>Pengeluaran pribadi</li><li>Materi kuliah</li><li>Aktivitas rekreasi</li></ul><p>Banyak usaha menerima kartu internasional, namun disarankan membawa sejumlah Rupiah (IDR) untuk pembelian kecil.</p>',
          ),
        },
        {
          title: t('Sort out health insurance', 'Urus asuransi kesehatan'),
          body: html(
            '<p>Every international student should hold valid health insurance covering their entire stay in Indonesia. Ideally it includes:</p><ul><li>Outpatient care</li><li>Hospitalization</li><li>Emergency treatment</li><li>Prescription medication</li><li>Medical evacuation (if applicable)</li></ul><p>Keep both digital and printed copies of your policy.</p>',
            '<p>Setiap mahasiswa internasional wajib memiliki asuransi kesehatan yang berlaku selama seluruh masa tinggal di Indonesia. Idealnya mencakup:</p><ul><li>Rawat jalan</li><li>Rawat inap</li><li>Penanganan darurat</li><li>Obat resep</li><li>Evakuasi medis (jika diperlukan)</li></ul><p>Simpan salinan digital dan cetak dari polis Anda.</p>',
          ),
        },
        {
          title: t('Prepare for your health', 'Persiapkan kesehatan Anda'),
          body: html(
            '<p>Before leaving your home country:</p><ul><li>Complete any recommended vaccinations.</li><li>Bring prescription medicines in their original packaging.</li><li>Carry copies of your prescriptions in English.</li><li>Pack a basic first-aid kit for minor illnesses.</li></ul><p>If you have any medical conditions or accessibility needs, let the International Office know in advance so support can be arranged.</p>',
            '<p>Sebelum meninggalkan negara asal Anda:</p><ul><li>Lengkapi vaksinasi yang direkomendasikan.</li><li>Bawa obat resep dalam kemasan aslinya.</li><li>Bawa salinan resep Anda dalam bahasa Inggris.</li><li>Siapkan kotak P3K dasar untuk sakit ringan.</li></ul><p>Jika Anda memiliki kondisi medis atau kebutuhan aksesibilitas, beritahu Kantor Internasional lebih awal agar dukungan dapat disiapkan.</p>',
          ),
        },
      ],
    }),

    // 4 — What to pack -----------------------------------------------------
    featureList({
      heading: t('What to pack', 'Apa yang perlu dibawa'),
      intro: t(
        'Indonesia has a tropical climate with warm temperatures throughout the year. Pack light — and don’t forget the essentials below.',
        'Indonesia beriklim tropis dengan suhu hangat sepanjang tahun. Bawalah barang secukupnya — dan jangan lupa hal-hal penting berikut.',
      ),
      items: [
        {
          icon: 'book',
          title: t('Essential documents', 'Dokumen penting'),
          body: html(
            '<ul><li>Passport &amp; visa</li><li>Letter of Acceptance</li><li>Insurance documents</li><li>Flight tickets</li><li>Emergency contacts</li></ul>',
            '<ul><li>Paspor &amp; visa</li><li>Letter of Acceptance</li><li>Dokumen asuransi</li><li>Tiket pesawat</li><li>Kontak darurat</li></ul>',
          ),
        },
        {
          icon: 'sparkles',
          title: t('Clothing', 'Pakaian'),
          body: html(
            '<ul><li>Lightweight casual clothing</li><li>Comfortable walking shoes</li><li>Light jacket for air-conditioned rooms</li><li>Formal attire for official events</li></ul>',
            '<ul><li>Pakaian kasual yang ringan</li><li>Sepatu yang nyaman untuk berjalan</li><li>Jaket tipis untuk ruangan ber-AC</li><li>Pakaian formal untuk acara resmi</li></ul>',
          ),
        },
        {
          icon: 'idea',
          title: t('Electronics', 'Elektronik'),
          body: html(
            '<ul><li>Laptop &amp; mobile phone</li><li>Chargers</li><li>Universal travel adapter</li><li>Power bank</li></ul>',
            '<ul><li>Laptop &amp; ponsel</li><li>Pengisi daya</li><li>Adaptor colokan universal</li><li>Power bank</li></ul>',
          ),
        },
        {
          icon: 'heart',
          title: t('Personal items', 'Barang pribadi'),
          body: html(
            '<ul><li>Prescription medicines</li><li>Toiletries</li><li>Glasses or contact lenses</li><li>Reusable water bottle</li><li>Small umbrella</li></ul>',
            '<ul><li>Obat resep</li><li>Perlengkapan mandi</li><li>Kacamata atau lensa kontak</li><li>Botol minum isi ulang</li><li>Payung kecil</li></ul>',
          ),
        },
      ],
    }, { background: 'accent-tint', accent: 'amber', columns: 2 }),

    // 5 — Important documents checklist -----------------------------------
    richText({
      html: html(
        '<h2>Important documents checklist</h2><p>Carry both printed and digital copies of:</p><ul><li>Passport (valid for at least six months)</li><li>Student Visa or entry permit</li><li>Letter of Acceptance (LoA)</li><li>Flight itinerary</li><li>Accommodation confirmation</li><li>Health insurance certificate</li><li>Passport-sized photographs</li><li>Emergency contact list</li><li>Academic transcripts or certificates (if requested)</li><li>Vaccination or medical records (if applicable)</li></ul><p><strong>Tip:</strong> Store digital copies securely online in case of emergencies.</p>',
        '<h2>Daftar dokumen penting</h2><p>Bawalah salinan cetak dan digital dari:</p><ul><li>Paspor (berlaku minimal enam bulan)</li><li>Visa Pelajar atau izin masuk</li><li>Letter of Acceptance (LoA)</li><li>Itinerary penerbangan</li><li>Konfirmasi akomodasi</li><li>Sertifikat asuransi kesehatan</li><li>Pasfoto ukuran paspor</li><li>Daftar kontak darurat</li><li>Transkrip atau sertifikat akademik (jika diminta)</li><li>Catatan vaksinasi atau medis (jika ada)</li></ul><p><strong>Tips:</strong> Simpan salinan digital secara aman di penyimpanan daring untuk keadaan darurat.</p>',
      ),
    }),

    // 6 — Upon arrival -----------------------------------------------------
    featureList({
      heading: t('Upon arrival', 'Saat tiba'),
      intro: t(
        'Welcome to Surabaya! After landing, work through these first steps to settle in.',
        'Selamat datang di Surabaya! Setelah mendarat, ikuti langkah-langkah awal berikut untuk mulai menetap.',
      ),
      items: [
        { icon: 'mail', title: t('Notify the International Office', 'Beritahu Kantor Internasional'), body: html('<p>Let us know you have arrived safely.</p>', '<p>Kabari kami bahwa Anda telah tiba dengan selamat.</p>') },
        { icon: 'pin', title: t('Travel to your accommodation', 'Menuju akomodasi Anda'), body: html('<p>Use a registered transport service and check in to your residence.</p>', '<p>Gunakan layanan transportasi resmi dan check in ke tempat tinggal Anda.</p>') },
        { icon: 'calendar', title: t('Attend the Orientation', 'Ikuti Orientasi'), body: html('<p>Join the International Student Orientation.</p>', '<p>Ikuti Orientasi Mahasiswa Internasional.</p>') },
        { icon: 'book', title: t('Complete registration', 'Selesaikan registrasi'), body: html('<p>Finish your registration procedures on campus.</p>', '<p>Selesaikan prosedur registrasi Anda di kampus.</p>') },
        { icon: 'award', title: t('Receive your Student ID', 'Terima Kartu Mahasiswa'), body: html('<p>Collect your Student ID Card.</p>', '<p>Ambil Kartu Tanda Mahasiswa Anda.</p>') },
        { icon: 'idea', title: t('Activate your account', 'Aktifkan akun Anda'), body: html('<p>Set up your university account and email.</p>', '<p>Aktifkan akun dan email universitas Anda.</p>') },
        { icon: 'globe', title: t('Finalize immigration reporting', 'Lengkapi pelaporan imigrasi'), body: html('<p>Complete immigration reporting if required.</p>', '<p>Selesaikan pelaporan imigrasi bila diperlukan.</p>') },
        { icon: 'compass', title: t('Explore the campus', 'Jelajahi kampus'), body: html('<p>Familiarize yourself with campus facilities and services.</p>', '<p>Kenali fasilitas dan layanan kampus.</p>') },
      ],
    }, { background: 'navy', accent: 'cyan', layout: 'grid', columns: 4 }),

    // 7 — Settling in (header) --------------------------------------------
    sectionHeader({
      eyebrow: t('Once you’re here', 'Setelah Anda di sini'),
      heading: t('Settling into life at Petra', 'Beradaptasi dengan kehidupan di Petra'),
      intro: t(
        'From Orientation Week to daily life in Surabaya — here’s what to expect as you make Petra your new home.',
        'Dari Pekan Orientasi hingga kehidupan sehari-hari di Surabaya — inilah yang dapat Anda harapkan saat menjadikan Petra rumah baru Anda.',
      ),
    }),

    // 8 — Life-at-Petra tabs ----------------------------------------------
    tabs({
      heading: t('Life at Petra', 'Kehidupan di Petra'),
      tabs: [
        {
          label: t('Orientation Week', 'Pekan Orientasi'),
          body: html(
            '<p>Orientation is an important part of your transition to Petra. During Orientation, you will:</p><ul><li>Meet fellow international and local students.</li><li>Learn about academic regulations.</li><li>Discover campus facilities and student services.</li><li>Join cultural activities.</li><li>Explore Surabaya through guided introductions.</li><li>Receive practical information about daily life in Indonesia.</li></ul><p>Attendance is strongly encouraged.</p>',
            '<p>Orientasi merupakan bagian penting dari transisi Anda ke Petra. Selama Orientasi, Anda akan:</p><ul><li>Bertemu sesama mahasiswa internasional dan lokal.</li><li>Mempelajari peraturan akademik.</li><li>Mengenal fasilitas kampus dan layanan mahasiswa.</li><li>Mengikuti kegiatan budaya.</li><li>Menjelajahi Surabaya melalui pengenalan terpandu.</li><li>Memperoleh informasi praktis tentang kehidupan sehari-hari di Indonesia.</li></ul><p>Kehadiran sangat dianjurkan.</p>',
          ),
        },
        {
          label: t('Living in Surabaya', 'Tinggal di Surabaya'),
          body: html(
            '<p>As Indonesia’s second-largest city, Surabaya blends modern urban living with rich cultural heritage. Students enjoy:</p><ul><li>Affordable living costs</li><li>Excellent food options</li><li>Shopping malls and traditional markets</li><li>Public transport and ride-hailing services</li><li>Hospitals and healthcare facilities</li><li>Parks and recreational spaces</li><li>Easy access to tourist destinations across East Java</li></ul>',
            '<p>Sebagai kota terbesar kedua di Indonesia, Surabaya memadukan kehidupan urban modern dengan warisan budaya yang kaya. Mahasiswa dapat menikmati:</p><ul><li>Biaya hidup yang terjangkau</li><li>Pilihan kuliner yang melimpah</li><li>Pusat perbelanjaan dan pasar tradisional</li><li>Transportasi umum dan layanan ojek/taksi daring</li><li>Rumah sakit dan fasilitas kesehatan</li><li>Taman dan ruang rekreasi</li><li>Akses mudah ke destinasi wisata di seluruh Jawa Timur</li></ul>',
          ),
        },
        {
          label: t('Academic Life', 'Kehidupan Akademik'),
          body: html(
            '<p>Classes at Petra emphasize collaboration, creativity, and active learning. Students are encouraged to:</p><ul><li>Participate in discussions.</li><li>Work on group projects.</li><li>Communicate with lecturers.</li><li>Join student organizations.</li><li>Attend seminars and workshops.</li><li>Engage in community service and international activities.</li></ul><p>Academic integrity and mutual respect are fundamental values within our learning community.</p>',
            '<p>Perkuliahan di Petra menekankan kolaborasi, kreativitas, dan pembelajaran aktif. Mahasiswa didorong untuk:</p><ul><li>Aktif berdiskusi.</li><li>Mengerjakan proyek kelompok.</li><li>Berkomunikasi dengan dosen.</li><li>Bergabung dengan organisasi mahasiswa.</li><li>Menghadiri seminar dan lokakarya.</li><li>Terlibat dalam pengabdian masyarakat dan kegiatan internasional.</li></ul><p>Integritas akademik dan saling menghormati adalah nilai-nilai mendasar dalam komunitas belajar kami.</p>',
          ),
        },
        {
          label: t('Health & Safety', 'Kesehatan & Keselamatan'),
          body: html(
            '<p>Your safety is our priority. While studying in Indonesia:</p><ul><li>Save important emergency numbers.</li><li>Keep copies of your identification documents.</li><li>Respect Indonesian laws and local customs.</li><li>Stay hydrated in the tropical climate.</li><li>Protect yourself from excessive sun exposure.</li><li>Use registered transportation services.</li><li>Contact the International Office if you need assistance.</li></ul>',
            '<p>Keselamatan Anda adalah prioritas kami. Selama menempuh studi di Indonesia:</p><ul><li>Simpan nomor darurat penting.</li><li>Simpan salinan dokumen identitas Anda.</li><li>Hormati hukum Indonesia dan adat setempat.</li><li>Jaga cairan tubuh di iklim tropis.</li><li>Lindungi diri dari paparan sinar matahari berlebih.</li><li>Gunakan layanan transportasi resmi.</li><li>Hubungi Kantor Internasional bila memerlukan bantuan.</li></ul>',
          ),
        },
        {
          label: t('Stay Connected', 'Tetap Terhubung'),
          body: html(
            '<p>Staying connected makes daily life much easier. We recommend:</p><ul><li>Activating international roaming before departure.</li><li>Purchasing an Indonesian SIM card after arrival.</li><li>Downloading navigation, transport, translation, food-delivery, and digital-payment apps.</li><li>Connecting to Petra’s campus Wi-Fi with your student account.</li></ul><p>Reliable internet access is available throughout the university.</p>',
            '<p>Tetap terhubung membuat kehidupan sehari-hari jauh lebih mudah. Kami menyarankan:</p><ul><li>Mengaktifkan roaming internasional sebelum berangkat.</li><li>Membeli kartu SIM Indonesia setelah tiba.</li><li>Mengunduh aplikasi navigasi, transportasi, penerjemah, pesan-antar makanan, dan pembayaran digital.</li><li>Menghubungkan perangkat ke Wi-Fi kampus Petra dengan akun mahasiswa Anda.</li></ul><p>Akses internet yang andal tersedia di seluruh area universitas.</p>',
          ),
        },
        {
          label: t('Cultural Tips', 'Tips Budaya'),
          body: html(
            '<p>Indonesia is known for its hospitality and cultural diversity. To help you adapt:</p><ul><li>Dress respectfully, especially at religious or formal places.</li><li>Be punctual for classes and official appointments.</li><li>Learn a few basic Indonesian phrases.</li><li>Respect local customs and traditions.</li><li>Be open to new foods, cultures, and perspectives.</li></ul><p>A friendly attitude and willingness to learn will help you build meaningful connections throughout your stay.</p>',
            '<p>Indonesia dikenal dengan keramahannya dan keberagaman budayanya. Untuk membantu Anda beradaptasi:</p><ul><li>Berpakaian sopan, terutama di tempat ibadah atau acara formal.</li><li>Tepat waktu untuk kuliah dan janji resmi.</li><li>Pelajari beberapa frasa dasar bahasa Indonesia.</li><li>Hormati adat dan tradisi setempat.</li><li>Terbuka terhadap makanan, budaya, dan perspektif baru.</li></ul><p>Sikap ramah dan kemauan untuk belajar akan membantu Anda membangun hubungan yang bermakna selama masa tinggal Anda.</p>',
          ),
        },
      ],
    }),

    // 9 — Need assistance (CTA) -------------------------------------------
    cta({
      eyebrow: t('We’re here to help', 'Kami siap membantu'),
      heading: t('Need assistance before you arrive?', 'Butuh bantuan sebelum Anda tiba?'),
      subcopy: t(
        'Whether you have questions about immigration, accommodation, academic life, or cultural adjustment, the International Office is ready to support you — before your arrival and throughout your time at Petra. See you in Surabaya soon!',
        'Baik pertanyaan tentang imigrasi, akomodasi, kehidupan akademik, maupun penyesuaian budaya, Kantor Internasional siap mendukung Anda — sebelum kedatangan dan selama masa studi Anda di Petra. Sampai jumpa di Surabaya!',
      ),
      ctas: [
        { href: '/about/contact-us', label: t('Contact the International Office', 'Hubungi Kantor Internasional'), newTab: false, variant: 'blue' },
        { href: '/life-at-petra/faq', label: t('Read the FAQ', 'Baca FAQ'), newTab: false, variant: 'outline' },
      ],
    }),
  ];
}

// ---------------------------------------------------------------------------
async function main() {
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
  console.log('Edit it in /admin → Pages → Pre-Departure Guide.');
}

main().catch((e) => { console.error(e); process.exit(1); });
