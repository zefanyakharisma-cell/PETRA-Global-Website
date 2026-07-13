# Website & CMS International Office Universitas Kristen Petra

## Hasil (Outcome)

Sebuah website publik yang sepenuhnya dwibahasa (Inggris / Indonesia, siap untuk bahasa Mandarin) untuk International Office (IO) Universitas Kristen Petra (PETRA), Surabaya — didukung oleh sistem manajemen konten (CMS) berbasis blok yang dibangun khusus. Setiap halaman disusun dari pustaka blok konten yang dapat digunakan ulang, dan editor non-teknis dapat mengelola seluruh situs melalui editor visual drag-and-drop langsung di `/admin`, lengkap dengan CRUD berbasis skema untuk staf, program, mitra, berita, fakultas, dan lainnya. Konten dapat dipublikasikan tanpa perlu deploy ulang berkat incremental static regeneration.

## Latar Belakang Masalah (Mengapa Proyek Ini Penting)

International Office adalah pintu gerbang universitas ke dunia — kanal utama bagi calon mahasiswa internasional, program mobilitas masuk/keluar (inbound/outbound), dan institusi mitra global. Namun kehadiran webnya perlu:

- **Dwibahasa dan siap untuk bahasa ketiga.** Audiens internasional (Inggris) dan pemangku kepentingan domestik (Indonesia) harus dilayani setara, dengan bahasa Mandarin yang siap ditambahkan nanti tanpa perlu membangun ulang sistem.
- **Dapat dikelola sendiri oleh kantor, bukan oleh developer.** Detail program, daftar mitra, berita, dan staf terus berubah; menyalurkan setiap perubahan melalui developer itu lambat dan mahal.
- **Konsisten dan sesuai brand di puluhan halaman.** Halaman yang dibuat manual cenderung menyimpang dari sisi tata letak dan kualitas. Sistem blok bersama menjamin tampilan yang koheren namun tetap memungkinkan komposisi halaman yang kaya dan beragam.
- **Kredibel untuk perekrutan.** Calon mahasiswa dan universitas mitra menilai kredibilitas dari situsnya — harus cepat, mudah diakses, kuat secara SEO, serta mampu menangkap dan meneruskan pertanyaan (inquiry) dengan andal.

Proyek ini menjawab keempat kebutuhan tersebut dengan memadukan situs publik yang rapi dan CMS khusus yang sepenuhnya dikendalikan oleh kantor.

## Tujuan Proyek

Memberikan International Office Petra sebuah platform digital multibahasa yang dikelola sendiri — untuk menampilkan program, kemitraan, dan sumber daya manusianya kepada audiens global — sekaligus memberdayakan staf agar dapat menjaga platform tersebut tetap mutakhir melalui editor visual yang intuitif, tanpa keterlibatan developer secara berkelanjutan.

## Fitur

- **Pembangun halaman berbasis blok** — sekitar 30 jenis blok yang dapat digunakan ulang (hero, teks kaya, gabungan gambar/teks, strip statistik, grid kartu, accordion, tab, timeline, galeri, dinding logo, peta lokasi & petunjuk arah, grafik data, banner CTA, dan lainnya) yang dirangkai menjadi tata letak halaman apa pun.
- **Editor drag-and-drop langsung** — mengurutkan ulang, menggandakan, dan menghapus blok dengan dnd-kit; formulir panel samping yang dibuat per blok; pratinjau langsung dalam iframe dari draf sesungguhnya.
- **Konten dwibahasa penuh (EN / ID)** — semua konten yang dapat diterjemahkan disimpan sebagai peta lokal JSONB; tab pengeditan EN/ID per kolom; bahasa Mandarin dapat ditambahkan tanpa perubahan model data; alternatif hreflang dihasilkan otomatis.
- **Navigasi yang terbangun otomatis** — menu terbentuk sendiri dari halaman yang dipublikasikan, dikelompokkan per bagian dan disusun bertingkat melalui hierarki induk/anak menjadi menu dropdown → flyout.
- **CRUD entitas berbasis skema** — satu layar admin generik mengelola staf, program, mitra, mitra domestik, berita, testimoni, fakultas, program studi, dan mata kuliah.
- **Peta dunia mitra interaktif** — blok andalan, dipisah kodenya (code-split) dari jalur kritis demi performa.
- **Peta lokasi & grafik data** — blok peta lokasi/petunjuk arah bertenaga MapLibre dan blok grafik bertenaga recharts (dari data manual atau kueri basis data tersimpan).
- **Penangkapan & penerusan inquiry** — formulir pertanyaan tervalidasi (dengan proteksi spam honeypot) yang menyimpan kiriman dan mengirim notifikasi email secara best-effort ke penerima yang tepat.
- **Pengeditan teks kaya** — editor TipTap dengan tautan, sorotan, perataan, dan penataan gaya.
- **Manajemen media** — unggah gambar dengan pemotongan (crop) ke bucket penyimpanan publik, disajikan melalui `next/image` yang teroptimasi.
- **Row-Level Security** — pembaca publik hanya melihat konten yang dipublikasikan; admin terautentikasi mendapat CRUD penuh; operasi khusus server melewati RLS dengan aman.
- **SEO & aksesibilitas bawaan** — metadata per halaman, tag Open Graph/Twitter, JSON-LD, sitemap & robots yang dihasilkan otomatis, target WCAG 2.1 AA (landmark semantik, skip link, status fokus, dukungan reduced-motion).
- **Berita, program, dan desain empty-state** — rute detail khusus untuk berita dan program; empty state yang sesuai brand sehingga situs tampak disengaja sebelum konten diisi.

## Tech Stack

### Frontend
- **Next.js 14** (App Router, React Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS** dengan design token
- **next-intl** untuk internasionalisasi (en, id, siap zh)
- **framer-motion** untuk animasi
- **TipTap** (pengeditan teks kaya) · **dnd-kit** (drag-and-drop)
- **react-simple-maps** / **maplibre-gl** (peta mitra & lokasi)
- **recharts** (blok grafik data)
- **react-hook-form** + **zod** (formulir & validasi)

### Backend
- **Next.js Server Actions & Route Handlers** (mutasi data sisi server, pengiriman inquiry, proxy media, pencarian situs)
- **Supabase Auth** (autentikasi admin & penanganan sesi)
- **Resend** (email notifikasi inquiry transaksional)
- **zod** (validasi sisi server)

### Database
- **Supabase (PostgreSQL)** — skema khusus `petra_io`, kebijakan Row-Level Security, trigger `updated_at`, dan migrasi SQL berversi
- **Supabase Storage** — bucket `petra-io-media` publik-baca untuk unggahan
- Konten terlokalisasi disimpan sebagai **peta lokal JSONB** (`{ en, id }`)

### Hosting
- **Vercel** — hosting produksi dengan **Incremental Static Regeneration (ISR)** sehingga konten yang dipublikasikan menyebar tanpa deploy ulang
- **Supabase** — backend Postgres, Auth, dan Storage terkelola
