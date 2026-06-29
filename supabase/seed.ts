/**
 * OPTIONAL seed — NOT run by default. Per the client brief, do NOT seed real
 * PETRA content. This inserts a handful of clearly-labelled PLACEHOLDER rows
 * purely to demonstrate layout; an admin can delete them. Run deliberately with:
 *
 *   npm run db:seed
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

async function main() {
  console.log('Seeding PLACEHOLDER demo content into petra_io …');

  const { data: staff } = await supabase
    .from('staff')
    .insert({
      name: '[Placeholder] IO Coordinator',
      email: 'placeholder@example.com',
      role: { en: 'International Office Coordinator', id: 'Koordinator International Office' },
      area: { en: 'Inbound mobility', id: 'Mobilitas masuk' },
      is_active: true,
    })
    .select('id')
    .single();

  await supabase.from('programs').insert([
    {
      slug: 'placeholder-semester-exchange',
      kind: 'inbound',
      title: { en: '[Placeholder] Semester Exchange', id: '[Placeholder] Pertukaran Semester' },
      summary: { en: 'Demo program row — replace or delete in the admin panel.', id: 'Baris program demo — ganti atau hapus di panel admin.' },
      cost: { en: 'Contact us', id: 'Hubungi kami' },
      duration: '1 semester',
      owner_staff_id: staff?.id ?? null,
      is_featured: true,
    },
  ]);

  await supabase.from('partners').insert([
    { name: '[Placeholder] Partner University', country: 'Taiwan', lat: 25.0375, lng: 121.5637, kind: 'international', region: 'Asia' },
    { name: '[Placeholder] Partner College', country: 'Netherlands', lat: 52.3676, lng: 4.9041, kind: 'international', region: 'Europe' },
  ]);

  await supabase.from('news').insert([
    {
      slug: 'placeholder-welcome',
      title: { en: '[Placeholder] Welcome to the new IO site', id: '[Placeholder] Selamat datang di situs IO baru' },
      body: { en: '<p>Demo article. Replace or delete in the admin panel.</p>', id: '<p>Artikel demo. Ganti atau hapus di panel admin.</p>' },
      tags: ['inbound'],
      published_at: new Date().toISOString(),
    },
  ]);

  await supabase.from('testimonials').insert([
    {
      person_name: '[Placeholder] Exchange Student',
      country: 'Korea',
      quote: { en: 'A demo testimonial — replace with a real story.', id: 'Testimoni demo — ganti dengan kisah nyata.' },
    },
  ]);

  console.log('Done. These rows are clearly labelled placeholders — remove them before launch.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
