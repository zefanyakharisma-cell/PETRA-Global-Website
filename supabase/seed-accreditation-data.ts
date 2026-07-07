/**
 * Seed structured Accreditation data into the CMS — the per–study-program
 * accreditation records that render under Academics → faculty → program in the
 * FacultiesBlock explorer (petra_io.courses rows with area = 'accreditation').
 *
 * Source: "Petra Christian University Study Program Accreditation Status" (QA
 * Office). Each CSV line becomes one accreditation item attached to a study
 * program:
 *     name        → "National / International Accreditation"
 *     meta.institution → accrediting body (BAN-PT, LAM Teknik, AUN-QA, …)
 *     meta.credential  → grade (Excellent / A / …) or accord (Washington/Canberra)
 *     meta.detail      → "Valid until DD/MM/YYYY"
 *     description      → decree number / international recognition note
 *
 * The CSV lists the university's *official* programs; the CMS study_programs
 * table is the curated *international* lineup, so:
 *   • 12 official programs missing from the CMS are created here (upsert by slug,
 *     under their correct faculty) so their accreditation has a home.
 *   • Two programs the CMS split into international variants attach to all
 *     variants: Communication Science → Strategic Communication + Creative Media
 *     Communication; English → English for Business + English for Creative
 *     Industries.
 *
 * Idempotent & re-runnable: new study programs upsert (never overwrite existing);
 * all area='accreditation' course rows are deleted and re-inserted. Touches
 * nothing else. Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), read from
 * .env.local.
 *
 *   npm run db:seed:accreditation-data
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

type L = { en: string; id: string };
const t = (en: string, id: string): L => ({ en, id });

// --- 1. Study programs that exist in the accreditation list but not yet in the
//        CMS. Created under their faculty (by faculty slug) so accreditation has
//        somewhere to attach. Upserted by slug — never overwrites an existing row.
const FACULTY_BY_SLUG: Record<string, string> = {}; // slug -> id (filled at runtime)

const NEW_PROGRAMS: {
  slug: string; faculty: string; name: L; degree: string; position: number;
}[] = [
  // Faculty of Industrial Technology (fit)
  { slug: 'electrical-engineering', faculty: 'fit', name: t('Electrical Engineering', 'Teknik Elektro'), degree: 'Bachelor / S1', position: 11 },
  { slug: 'informatics', faculty: 'fit', name: t('Informatics', 'Informatika'), degree: 'Bachelor / S1', position: 12 },
  { slug: 'mechanical-engineering', faculty: 'fit', name: t('Mechanical Engineering', 'Teknik Mesin'), degree: 'Bachelor / S1', position: 13 },
  { slug: 'food-technology', faculty: 'fit', name: t('Food Technology', 'Teknologi Pangan'), degree: 'Bachelor / S1', position: 14 },
  { slug: 'm-industrial-engineering', faculty: 'fit', name: t('Master of Industrial Engineering', 'Magister Teknik Industri'), degree: 'Master / S2', position: 15 },
  { slug: 'engineer-profession', faculty: 'fit', name: t('Engineer Profession Education', 'Pendidikan Profesi Insinyur'), degree: 'Profession / Profesi', position: 16 },
  // School of Business and Management (sbm)
  { slug: 'management', faculty: 'sbm', name: t('Management', 'Manajemen'), degree: 'Bachelor / S1', position: 28 },
  { slug: 'accounting', faculty: 'sbm', name: t('Accounting', 'Akuntansi'), degree: 'Bachelor / S1', position: 29 },
  { slug: 'm-management', faculty: 'sbm', name: t('Master of Management', 'Magister Manajemen'), degree: 'Master / S2', position: 30 },
  { slug: 'd-management-science', faculty: 'sbm', name: t('Doctoral Program of Management Science', 'Program Doktor Ilmu Manajemen'), degree: 'Doctoral / S3', position: 31 },
  // Faculty of Medicine (fk)
  { slug: 'medical-doctor-profession', faculty: 'fk', name: t('Medical Doctor Professional Education', 'Pendidikan Profesi Dokter'), degree: 'Profession / Profesi', position: 13 },
  // Faculty of Dentistry (fkg)
  { slug: 'dentist-profession', faculty: 'fkg', name: t('Dentist Professional Education', 'Pendidikan Profesi Dokter Gigi'), degree: 'Profession / Profesi', position: 14 },
];

// --- 2. The accreditation records. One per CSV line; `programs` may list several
//        study-program slugs (the split international variants attach to all).
type AccType = 'National' | 'International';
interface Accred {
  programs: string[];
  type: AccType;
  body: string;
  result?: string;   // national grade
  expiry: string;    // DD/MM/YYYY
  decree?: string;
}

// International bodies: short accord badge + the recognition sentence for the note.
const INTL: Record<string, { accord?: string; en: string; id: string }> = {
  'AUN-QA': {
    en: 'ASEAN University Network – Quality Assurance (AUN-QA) international programme assessment.',
    id: 'Asesmen program internasional ASEAN University Network – Quality Assurance (AUN-QA).',
  },
  AQAS: {
    en: 'Accredited by AQAS (Germany) under the European Standards and Guidelines (ESG).',
    id: 'Terakreditasi AQAS (Jerman) sesuai European Standards and Guidelines (ESG).',
  },
  IABEE: {
    accord: 'Washington Accord',
    en: 'General Accreditation by IABEE — full international-level recognition under the Washington Accord (Engineering).',
    id: 'Akreditasi Umum oleh IABEE — pengakuan setara internasional di bawah Washington Accord (Teknik).',
  },
  KAAB: {
    accord: 'Canberra Accord',
    en: 'Accredited by the Korea Architectural Accrediting Board (KAAB), a full signatory of the Canberra Accord.',
    id: 'Terakreditasi Korea Architectural Accrediting Board (KAAB), penandatangan penuh Canberra Accord.',
  },
};

const ACCRED: Accred[] = [
  // Communication Science → both CMS variants
  { programs: ['strategic-communication', 'creative-media-communication'], type: 'National', body: 'BAN-PT', result: 'A', expiry: '31/05/2027', decree: '3027/SK/BAN-PT/Ak-PPJ/S/V/2022' },
  { programs: ['strategic-communication', 'creative-media-communication'], type: 'International', body: 'AUN-QA', expiry: '08/05/2026', decree: 'AP627UKPETRAAPR21' },
  // Chinese
  { programs: ['chinese'], type: 'National', body: 'BAN-PT', result: 'B', expiry: '25/11/2026', decree: '12932/SK/BAN-PT/Ak-PPJ/S/XII/2021' },
  // Visual Communication Design
  { programs: ['visual-communication-design'], type: 'National', body: 'BAN-PT', result: 'Excellent', expiry: '08/04/2030', decree: '6246/SK/BAN-PT/Ak.KP/S/IV/2025' },
  { programs: ['visual-communication-design'], type: 'International', body: 'AQAS', expiry: '31/03/2029', decree: 'N/A' },
  // English → both CMS variants
  { programs: ['english-for-business', 'english-for-creative-industries'], type: 'National', body: 'BAN-PT', result: 'Excellent', expiry: '16/11/2030', decree: '8207/SK/BAN-PT/Ak.Ppj/S/XI/2025' },
  // Interior Design
  { programs: ['interior-design'], type: 'National', body: 'BAN-PT', result: 'Excellent', expiry: '16/10/2029', decree: '6336/SK/BAN-PT/Ak.KP/S/V/2025' },
  { programs: ['interior-design'], type: 'International', body: 'AQAS', expiry: '31/03/2029', decree: 'N/A' },
  // Medicine
  { programs: ['medicine'], type: 'National', body: 'LAM PTKes', result: 'Good', expiry: '26/05/2026', decree: '0273/LAM-PTKes/Akr.PB/Sar/IX/2024' },
  // Dental Medicine
  { programs: ['dental-medicine'], type: 'National', body: 'LAM PTKes', result: 'Good', expiry: '31/08/2027', decree: '0086/LAM-PTKes/Akr.PB/Sar/V/2025' },
  // Elementary Teacher Education
  { programs: ['elementary-teacher-education'], type: 'National', body: 'LAMDIK', result: 'Very Good', expiry: '03/01/2028', decree: '54/SK/LAMDIK/Ak/S/I/2023' },
  // Early Childhood Teacher Education
  { programs: ['early-childhood-teacher-education'], type: 'National', body: 'BAN-PT', result: 'Good', expiry: '16/08/2027', decree: '5483/SK/BAN-PT/Ak/S/VIII/2022' },
  // Electrical Engineering (new program)
  { programs: ['electrical-engineering'], type: 'National', body: 'LAM Teknik', result: 'Excellent', expiry: '20/04/2031', decree: '0066/SK/LAM Teknik/AS/IV/2026' },
  { programs: ['electrical-engineering'], type: 'International', body: 'IABEE', expiry: '31/03/2028' },
  // Informatics (new program)
  { programs: ['informatics'], type: 'National', body: 'LAM INFOKOM', result: 'Excellent', expiry: '10/04/2031', decree: '005/SK/LAM-INFOKOM/Ak/S/IV/2026' },
  { programs: ['informatics'], type: 'International', body: 'IABEE', expiry: '31/03/2029', decree: '000175.A' },
  // Industrial Engineering
  { programs: ['industrial-engineering'], type: 'National', body: 'LAM Teknik', result: 'Excellent', expiry: '20/12/2029', decree: '0766/SK/LAM Teknik/AS/XII/2024' },
  { programs: ['industrial-engineering'], type: 'International', body: 'IABEE', expiry: '31/03/2029', decree: '000177.A' },
  // Mechanical Engineering (new program)
  { programs: ['mechanical-engineering'], type: 'National', body: 'LAM Teknik', result: 'Excellent', expiry: '20/04/2030', decree: '0219/SK/LAM Teknik/AS/IV/2025' },
  { programs: ['mechanical-engineering'], type: 'International', body: 'IABEE', expiry: '31/03/2029', decree: '000179.A' },
  // Food Technology (new program)
  { programs: ['food-technology'], type: 'National', body: 'BAN-PT', result: 'Temporary Accredited (new program)', expiry: '25/08/2030', decree: '7144/SK/BAN-PT/Ak.P/S1/VIII/2025' },
  // Civil Engineering (Bachelor)
  { programs: ['civil-engineering'], type: 'National', body: 'LAM Teknik', result: 'Excellent', expiry: '20/04/2031', decree: '0067/SK/LAM Teknik/AS/IV/2026' },
  { programs: ['civil-engineering'], type: 'International', body: 'IABEE', expiry: '31/03/2028', decree: '00134.A' },
  // Architecture (Bachelor)
  { programs: ['architecture'], type: 'National', body: 'BAN-PT', result: 'Excellent', expiry: '05/09/2030', decree: '7469/SK/BAN-PT/Ak.Ppj/S/IX/2025' },
  { programs: ['architecture'], type: 'International', body: 'KAAB', expiry: '30/01/2028', decree: 'KAAB-202511' },
  { programs: ['architecture'], type: 'International', body: 'AUN-QA', expiry: '08/05/2026', decree: 'AP628UKPETRAAPR21' },
  // Management (new program)
  { programs: ['management'], type: 'National', body: 'LAMEMBA', result: 'Excellent', expiry: '09/05/2030', decree: '2270/DE/A.5/AR.10/V/2025' },
  { programs: ['management'], type: 'International', body: 'AUN-QA', expiry: '08/05/2026', decree: 'AP625UKPETRAAPR21' },
  // Accounting (new program)
  { programs: ['accounting'], type: 'National', body: 'BAN-PT', result: 'A', expiry: '03/06/2026', decree: '5933/SK/BAN-PT/Ak-PPJ/S/VI/2021' },
  { programs: ['accounting'], type: 'International', body: 'AUN-QA', expiry: '08/05/2026', decree: 'AP626UKPETRAAPR21' },
  // Master of Literature
  { programs: ['mlit'], type: 'National', body: 'BAN-PT', result: 'Good', expiry: '13/12/2028', decree: '247/SK/BAN-PT/PEPA-Ppj/M/I/2024' },
  // Master of Design
  { programs: ['mds'], type: 'National', body: 'BAN-PT', result: 'Temporary Accredited (new program)', expiry: '25/08/2030', decree: '7142/SK/BAN-PT/Ak.P/S2/VIII/2025a' },
  // Master of Industrial Engineering (new program)
  { programs: ['m-industrial-engineering'], type: 'National', body: 'LAM Teknik', result: 'Very Good', expiry: '20/04/2028', decree: '0065/SK/LAM Teknik/AM/IV/2023' },
  // Master of Architecture
  { programs: ['m-architecture'], type: 'National', body: 'BAN-PT', result: 'B', expiry: '29/12/2028', decree: '5272/SK/BAN-PT/Ak.Ppj/M/XII/2023' },
  { programs: ['m-architecture'], type: 'International', body: 'KAAB', expiry: '30/01/2028', decree: 'KAAB-202511' },
  // Master of Civil Engineering — decree is a LAM Teknik number (CSV's institution
  // column said BAN-PT, treated as a source typo).
  { programs: ['m-civil-engineering'], type: 'National', body: 'LAM Teknik', result: 'Excellent', expiry: '20/08/2030', decree: '0540/SK/LAM Teknik/AM/VIII/2025' },
  // Master of Management (new program)
  { programs: ['m-management'], type: 'National', body: 'LAMEMBA', result: 'Excellent', expiry: '28/03/2029', decree: '1131/DE/A.5/AR.10/III/2024' },
  // Doctor of Civil Engineering
  { programs: ['d-civil-engineering'], type: 'National', body: 'LAM Teknik', result: 'Very Good', expiry: '20/04/2029', decree: '0143/SK/LAM Teknik/AD/IV/2024' },
  // Doctor of Management Science (new program)
  { programs: ['d-management-science'], type: 'National', body: 'LAMEMBA', result: 'Very Good', expiry: '23/05/2030', decree: '2326/DE/A.5/AR.10/V/2025' },
  // Engineer Profession Education (new program)
  { programs: ['engineer-profession'], type: 'National', body: 'LAM Teknik', result: 'Very Good', expiry: '20/08/2030', decree: '0541/SK/LAM Teknik/PI/VIII/2025' },
  // Medical Doctor Professional Education (new program)
  { programs: ['medical-doctor-profession'], type: 'National', body: 'LAM PTKes', result: 'Good', expiry: '22/09/2026', decree: '0093/LAM-PTKes/Akr.PB/Pro/V/2025' },
  // Dentist Professional Education (new program)
  { programs: ['dentist-profession'], type: 'National', body: 'LAM PTKes', result: 'Good', expiry: '31/08/2027', decree: '0087/LAM-PTKes/Akr.PB/Pro/V/2025' },
];

function buildRow(a: Accred, studyProgramId: string, position: number) {
  const isNational = a.type === 'National';
  const decree = a.decree?.trim() ?? '';
  const hasDecree = decree && decree.toUpperCase() !== 'N/A';

  const meta: Record<string, string> = { institution: a.body };
  const credential = isNational ? a.result : INTL[a.body]?.accord;
  if (credential) meta.credential = credential;
  if (a.expiry) meta.detail = `Valid until ${a.expiry}`;

  let description: L;
  if (isNational) {
    description = t(
      hasDecree ? `Decree No. ${decree}` : '',
      hasDecree ? `SK No. ${decree}` : '',
    );
  } else {
    const info = INTL[a.body];
    const ref = hasDecree ? ` (Ref. ${decree})` : '';
    description = t((info?.en ?? '') + ref, (info?.id ?? '') + ref);
  }

  return {
    study_program_id: studyProgramId,
    area: 'accreditation',
    name: isNational
      ? t('National Accreditation', 'Akreditasi Nasional')
      : t('International Accreditation', 'Akreditasi Internasional'),
    meta,
    description,
    position,
    is_active: true,
  };
}

async function main() {
  // Resolve faculties by slug.
  const { data: facs, error: facErr } = await supabase.from('faculties').select('id, slug');
  if (facErr || !facs) throw new Error(`Failed to load faculties: ${facErr?.message}`);
  for (const f of facs) FACULTY_BY_SLUG[f.slug] = f.id;

  // 1. Upsert the missing study programs (by slug — never overwrites existing).
  const programRows = NEW_PROGRAMS.map((p) => {
    const faculty_id = FACULTY_BY_SLUG[p.faculty];
    if (!faculty_id) throw new Error(`Unknown faculty slug "${p.faculty}" for program "${p.slug}"`);
    return { slug: p.slug, faculty_id, name: p.name, degree: p.degree, position: p.position, is_active: true };
  });
  const { error: upErr } = await supabase
    .from('study_programs')
    .upsert(programRows, { onConflict: 'slug', ignoreDuplicates: true });
  if (upErr) throw new Error(`Study-program upsert failed: ${upErr.message}`);
  console.log(`✓ Ensured ${programRows.length} study programs exist.`);

  // Resolve every study-program slug referenced by the accreditation list → id.
  const wanted = Array.from(new Set(ACCRED.flatMap((a) => a.programs)));
  const { data: sps, error: spErr } = await supabase
    .from('study_programs').select('id, slug').in('slug', wanted);
  if (spErr || !sps) throw new Error(`Failed to resolve study programs: ${spErr?.message}`);
  const idBySlug = Object.fromEntries(sps.map((s) => [s.slug, s.id])) as Record<string, string>;

  const missing = wanted.filter((s) => !idBySlug[s]);
  if (missing.length) throw new Error(`Study program slugs not found: ${missing.join(', ')}`);

  // 2. Clean slate for accreditation items, then insert.
  const { error: delErr } = await supabase.from('courses').delete().eq('area', 'accreditation');
  if (delErr) throw new Error(`Failed clearing existing accreditation items: ${delErr.message}`);

  const posBySlug: Record<string, number> = {};
  const rows: ReturnType<typeof buildRow>[] = [];
  for (const a of ACCRED) {
    for (const slug of a.programs) {
      const pos = posBySlug[slug] ?? 0;
      posBySlug[slug] = pos + 1;
      rows.push(buildRow(a, idBySlug[slug], pos));
    }
  }

  const { error: insErr } = await supabase.from('courses').insert(rows);
  if (insErr) throw new Error(`Accreditation insert failed: ${insErr.message}`);

  console.log(`✓ Seeded ${rows.length} accreditation items across ${Object.keys(posBySlug).length} study programs.`);
  console.log('View them in /admin → Program Items (grouped by area → Accreditation),');
  console.log('or on any page using the Faculties/Academics block with the "Accreditation" area enabled.');
}

main().catch((e) => { console.error(e); process.exit(1); });
